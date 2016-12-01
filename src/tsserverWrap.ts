/**
 * Author: Andrew Jakubowicz
 * 
 * This module exposes some of the funcitonality of the tsserver.
 */
import * as path from "path";
import * as readline from "readline";
import * as fs from "fs";
import * as ts from "TypeScript";

import * as child_process from "child_process";
import * as winston from "./appLogger";

// You can access the variables with config.maxDepth
let config = require("../config.json");


/**
 * Request body interface
 * 
 * The idea of this interface is to retain information about the token that the definition is called on.
 */
interface RequestBody {
    token?: string;
}


/**
 * Wrapper for tsserver.
 * 
 * TODO: make sure tsserver responds sequentually. Otherwise we'll get confused definitions.
 *          - TODO: This should be resolved downstream by comparing seq with req_seq.
 */
export class Tsserver{
    private proc: child_process.ChildProcess;
    private operations: [((err: Error, response: string | Buffer, request: string)=>void), string][] = [];
    private seq: number = 0;                                                // tsserver requires everything to have a sequence number.

    /**
     * Spawns tsserver singleton and awaits events.
     */
    constructor(){
        
        this.proc = child_process.spawn('tsserver');


        /**
         * This has to be able to handle batch responses.
         * Therefore it splits up the response and then process them individually.
         */
        this.proc.stdout.on("data", d => {
            winston.log('debug', `TSSERVER OUT: "${d}"`);

            // Split and filter out the stuff that isn't needed.
            let allData = d.toString().split(/\r\n|\n/).filter(v => {
                return !(v === '' || v.slice(0, 14) === 'Content-Length')} );

            // Grab first callback and data.
            let [callback, command] = this.operations.shift(),
                chunk = allData.shift();
            
            while (allData.length > 0){
                winston.log("debug", `Tsserver response: Checking lengths of operations vs callbacks: (${allData.length} == ${this.operations.length})`);
                callback(null, chunk, command);
                [callback, command] = this.operations.shift();
                chunk = allData.shift();
            }
            callback(null, chunk, command);
        });


        /**
         * Not actually sure if this will ever call.
         * I think tsserver responds with success: false in the case of error.
         */
        this.proc.stderr.on("data", d => {
            winston.log("error", `TSSERVER ERR: ${d}`);
            let [callback, command] = this.operations.shift();
            callback(new Error(d.toString()), null, command);
        });


        this.proc.on('close', (err,code) => {
            winston.log("debug", `TSSERVER QUIT: ${code}`);
        });
    }



    /**
     * Allows goto definition using tsserver.
     * This will store a callback on the FIFO queue.
     * If you don't open the file before trying to find definitions in it, this will fail.
     */
    definition(filePath:string, line: number, column: number, callback: (err: Error, response: string, request: string )=> void) {
        let command = `{"seq":${this.seq},"type":"quickinfo","command":"definition","arguments":{"file":"${filePath}", "line":${line}, "offset": ${column}}}\n`;
        winston.log("data", `SENDING TO TSSERVER: "${command}"`);
        this.proc.stdin.write(command);
        this.operations.push([callback, command]);
        this.seq++;
    }


    open(filePath: string, callback: (err: Error, response: string, request: string )=> void){
        let command = `{"seq":${this.seq},"type":"request","command":"open","arguments":{"file":"${filePath}"}}\n`;
        winston.log("data", `SENDING TO TSSERVER: "${command}"`);
        this.proc.stdin.write(command);
        this.operations.push([callback, command]);
        this.seq++;
    }


    kill(){
        winston.log("data", `TSSERVER SENDING QUIT REQUEST`);
        this.proc.kill();
    }


    /**
     * Reads entire typeScript file.
     */
    scanFile(filePath: string, callback: (err: Error, locations: string[][])=>void){
        this.scanFileBetween(filePath, null,  callback);
    }


    scanFileBetween = (filePath: string, lineStartAndEnd: [number, number], callback: (err: Error, locations: string[][])=>void) => {

        /**
         * Below code doesn't use root of directory as reference.
         * TODO: make sure this path reflects the root of the directory we are trying to traverse.
         * Answer here: http://stackoverflow.com/a/18721515
         */
        let appDir = path.dirname(global.appRoot);
        filePath = appDir + '/' + filePath;
        winston.log("debug", `function scanFile trying to access ${filePath}`);
        let tssFilePath = filePath;
        if (!fs.existsSync(filePath)){
            winston.log("debug", `File doesn't exist: ${filePath}`);
            callback(new Error(`File doesn't exist: ${filePath}`), null);
            return;
        }


        let results: string[][][] = [];
        this.open(filePath, function(err, response: string){
            // Probably want to check for success here.
            // TODO: add error handling.
            winston.log("verbose", `OPEN ${filePath}: ${response}`);
        });


        /**
         * Reading file from:
         * https://coderwall.com/p/ohjerg/read-large-text-files-in-nodejs
         */
        let instream = fs.createReadStream(filePath);
        let rl = readline.createInterface(instream, process.stdout);
        let lineNum = 0;
        
        let promises: Promise<String | Buffer>[] = [];

        /**
         * Setting up event to read the file.
         * Todo: Populate a cache to prevent the same file getting read over and over.
         *      - Important due to a single file containing many modules or namespaces.
         */
        rl.on('line', line => {
            lineNum ++;
            if (!lineStartAndEnd || (lineStartAndEnd[0] <= lineNum && lineStartAndEnd[1] >= lineNum)){
                let scanner = initScannerState(line);
                let token = scanner.scan();
                let tokenStart = scanner.getTokenPos();
                while (token != ts.SyntaxKind.EndOfFileToken){
                    if (token === ts.SyntaxKind.Identifier){
                        // Tokens seem to start with whitespace. Adding one allows the definition to be found.
                        promises.push(this.lookUpDefinition(tssFilePath,lineNum, tokenStart + 1,
                            {token: scanner.getTokenText()}));
                    }
                    token = scanner.scan();
                    tokenStart = scanner.getTokenPos();
                }
            }
        });

        /**
         * 
         */
        rl.on('close', () => {
            // Process promises after reading file has concluded.
            Promise.all(promises).then(function(){
                /**
                 * Arguments are all here in arguments[0], arguments[1].....
                 * Thank you: http://stackoverflow.com/a/10004137
                 */
                for (let i = 0; i < arguments.length; i++){
                    winston.log('silly', `ARGUMENTS: ${arguments[i]}`);
                    results.push(arguments[i]);
                }
                winston.log('verbose', `RESULTS: ${results}`);
                // Results somehow ends up as a type string[][][], with the first index being everything we want.
                // TODO: work out why we get a string[][][]!?
                callback(null, results[0]);
            }, function(err){
                winston.error(`Promise resolve error: '${err}'`);
            });
        });

        function initScannerState(text: string): ts.Scanner{
            // TODO: scanner matches tsconfig.
            let scanner = ts.createScanner(ts.ScriptTarget.Latest, true);
            scanner.setText(text);
            scanner.setOnError((message, length)=>{
                winston.error(`${message}`);
            });
            // TODO: match with users tsconfig.json
            scanner.setScriptTarget(ts.ScriptTarget.ES5);
            // TODO: match variant with tsconfig.json
            scanner.setLanguageVariant(ts.LanguageVariant.Standard);
            return scanner;
        }
    }

    /**
     * Uses the filepath, sourceFile and position to look up a definition.
     * Returns a promise.
     */
    lookUpDefinition(filePath: string, lineNum:number, tokenPos: number, reqBody: RequestBody){
        return new Promise<[string | Buffer, string]>((fulfill, reject) => {
            this.definition(filePath, lineNum, tokenPos, function(err, res, req){
                if (err) reject(err);
                else fulfill([mergeRequestWithBody(req, reqBody), res]);
            });
        });
    };
}


/**
 * This is the point at which we can add as much as we want to the request.
 */
function mergeRequestWithBody(req: string, body: RequestBody): string {
    let newReq = JSON.parse(req);
    newReq.body = body;
    return JSON.stringify(newReq);
}
