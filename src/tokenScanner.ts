/**
 * Author: Andrew Jakubowicz
 */
import * as fs from "fs";
import * as readline from "readline";
import* as path from "path";
import * as winston from "./appLogger";

import * as ts from "TypeScript";
import {Tsserver} from "./tsserverWrap";

/**
 * Request body interface
 * 
 * The idea of this interface is to retain information about the token that the definition is called on.
 */
interface RequestBody {
    token?: string;
}


/**
 * Reads entire typeScript file.
 */
export function scanFile(filePath: string, callback: (err: Error, locations: string[][])=>void){
    scanFileBetween(filePath, null,  callback);
}


/**
 * Always takes file paths from root of project directory.
 * 
 * lineStartAndEnd: [number, number] and is inclusive.
 * 
 * @parem {string[][]} locations is an array of tuples in the form [string, ]
 */
export function scanFileBetween(filePath: string, lineStartAndEnd: [number, number], callback: (err: Error, locations: string[][])=>void){
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
    let tsserver = new Tsserver();
    tsserver.open(filePath, function(err, response: string){
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
    rl.on('line', function(line){
        lineNum ++;
        if (!lineStartAndEnd || (lineStartAndEnd[0] <= lineNum && lineStartAndEnd[1] >= lineNum)){
            let scanner = initScannerState(line);
            let token = scanner.scan();
            let tokenStart = scanner.getTokenPos();
            while (token != ts.SyntaxKind.EndOfFileToken){
                if (token === ts.SyntaxKind.Identifier){
                    // Tokens seem to start with whitespace. Adding one allows the definition to be found.
                    promises.push(lookUpDefinition(tssFilePath, tsserver,lineNum, tokenStart + 1,
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
    rl.on('close', function(){
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
            tsserver.kill();
            winston.log('verbose', `RESULTS: ${results}`);
            // Results somehow ends up as a type string[][][], with the first index being everything we want.
            // TODO: work out why we get a string[][][]!?
            callback(null, results[0]);
        }, function(err){
            winston.log("error", `Promise resolve error: '${err}'`);
        });
    });

    function initScannerState(text: string): ts.Scanner{
        // TODO: scanner matches tsconfig.
        let scanner = ts.createScanner(ts.ScriptTarget.Latest, true);
        scanner.setText(text);
        scanner.setOnError((message, length)=>{
            winston.log('error', `${message}`);
        });
        // TODO: match with users tsconfig.json
        scanner.setScriptTarget(ts.ScriptTarget.ES5);
        // TODO: match variant with tsconfig.json
        scanner.setLanguageVariant(ts.LanguageVariant.Standard);
        return scanner;
    }

    /**
     * Uses the filepath, sourceFile, tsserver and position to look up a definition.
     * Returns a promise.
     */
    function lookUpDefinition(filePath: string, tsserver: Tsserver, lineNum:number, tokenPos: number, reqBody: RequestBody){
        return new Promise<[string | Buffer, string]>(function(fulfill, reject){
            tsserver.definition(filePath, lineNum, tokenPos, function(err, res, req){
                if (err) reject(err);
                else fulfill([mergeRequestWithBody(req, reqBody), res]);
            });
        });
    }

    /**
     * This is the point at which we can add as much as we want to the request.
     */
    function mergeRequestWithBody(req: string, body: RequestBody): string{
        let newReq = JSON.parse(req);
        newReq.body = body;
        return JSON.stringify(newReq);
    }
}


/**
 * Function that builds a structure that we can actually visualize and use to find more information.
 */
