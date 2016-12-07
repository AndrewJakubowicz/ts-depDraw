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


/**
 * methods fileScanner accepts
 */
enum CommandMethodsFileScan {
    Definition,
    References
}


/**
 * Request body interface
 * 
 * The idea of this interface is to retain information about the token that the definition is called on.
 */
interface RequestBody {
    tokenText: string;
    tokenType: string;
    filePath: string;
}


/**
 * Wrapper for tsserver.
 * 
 *          - TODO: Make sure seq and req_seq are always the same.
 */
export class Tsserver {
    private proc: child_process.ChildProcess;
    private operations: [((err: Error, response: string | Buffer, request: string) => void), string][] = [];
    private seq: number = 0;                                                // tsserver requires everything to have a sequence number.

    /**
     * Spawns tsserver singleton and awaits events.
     */
    constructor() {

        this.proc = child_process.exec('tsserver');


        /**
         * This has to be able to handle batch responses.
         * Therefore it splits up the response and then process them individually.
         */
        this.proc.stdout.on("data", d => {
            winston.log('debug', `TSSERVER OUT: "${d}"`);

            // Split and filter out the stuff that isn't needed.
            let allData = d.toString().split(/\r\n|\n/).filter(v => {
                return !(v === '' || v.slice(0, 14) === 'Content-Length')
            });

            // Grab first callback and data.
            let [callback, command] = this.operations.shift(),
                chunk = allData.shift();

            while (allData.length > 0) {
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


        this.proc.on('close', (err, code) => {
            winston.log("debug", `TSSERVER QUIT: ${code}`);
        });
    }



    /**
     * Allows goto definition using tsserver.
     * This will store a callback on the FIFO queue.
     * If you don't open the file before trying to find definitions in it, this will fail.
     */
    definition(filePath: string, line: number, column: number, callback: (err: Error, response: string, request: string) => void) {
        let command = `{"seq":${this.seq},"type":"request","command":"definition","arguments":{"file":"${filePath}", "line":${line}, "offset": ${column}}}\n`;
        winston.log("data", `SENDING TO TSSERVER: "${command}"`);
        this.proc.stdin.write(command);
        this.operations.push([callback, command]);
        this.seq++;
    }

    /**
     * Returns a response showing what implements something.
     */
    references(filePath: string, line: number, column: number, callback: (err: Error, response: string, request: string) => void) {
        let command = `{"seq":${this.seq},"type":"request","command":"references","arguments":{"file":"${filePath}", "line":${line}, "offset": ${column}}}\n`;
        winston.log("data", `SENDING TO TSSERVER: "${command}"`);
        this.proc.stdin.write(command);
        this.operations.push([callback, command]);
        this.seq++;
    }


    open(filePath: string, callback: (err: Error, response: string, request: string) => void){
        let command = `{"seq":${this.seq},"type":"request","command":"open","arguments":{"file":"${filePath}"}}\n`;
        winston.log("data", `SENDING TO TSSERVER: "${command}"`);
        this.proc.stdin.write(command);
        this.operations.push([callback, command]);
        this.seq++;
    }


    kill() {
        winston.log("data", `TSSERVER SENDING QUIT REQUEST`);
        this.proc.kill();
    }


    /**
     * Reads entire typeScript file.
     */
    scanFile(filePath: string, callback: (err: Error, locations: string[][]) => void) {
        return this.scanFileBetween(filePath, null, callback);
    }

    /**
     * Reads entire typeScript file using define.
     */
    scanFileBetween(filePath: string, lineStartAndEnd: [number, number], callback: (err: Error, locations: string[][]) => void) {
        return this.scanFileBetweenWorker(filePath, lineStartAndEnd, CommandMethodsFileScan.Definition, callback);
    }

    /**
     * Reads entire file using reference.
     */
    scanFileReference(filePath: string, callback: (err: Error, locations: string[][]) => void) {
        return this.scanFileBetweenReference(filePath, null, callback);
    }

    /**
     * Scans file and collects all the references between two line numbers. (inclusive)
     */
    scanFileBetweenReference(filePath: string, lineStartAndEnd: [number, number], callback: (err: Error, locations: string[][]) => void) {
        return this.scanFileBetweenWorker(filePath, lineStartAndEnd, CommandMethodsFileScan.References, callback);
    }

    /**
     * Worker which scans the file.
     */
    scanFileBetweenWorker = (filePath: string, lineStartAndEnd: [number, number], command: CommandMethodsFileScan, callback: (err: Error, locations: string[][]) => void) => {
        return Promise.resolve().then(() => {

            /**
             * Below code doesn't use root of directory as reference.
             * 
             * Modified using answer: http://stackoverflow.com/a/18721515
             */
            let appDir = path.dirname(require.main.filename);
            filePath = appDir + '/' + filePath;
            winston.log("debug", `function scanFile trying to access ${filePath}`);
            let tssFilePath = filePath;
            if (!fs.existsSync(filePath)) {
                winston.log("debug", `File doesn't exist: ${filePath}`);
                return callback(new Error(`File doesn't exist: ${filePath}`), null);
            }


            let results: string[][][] = [];
            this.open(filePath, function (err, response: string) {
                // Probably want to check for success here.
                if (err) {
                    return callback(new Error(`Failed to open ${filePath} with error ${err}.`), null);
                }
                winston.log("verbose", `OPEN ${filePath}: ${response}`);
            });


            /**
             * Reading file from:
             * https://coderwall.com/p/ohjerg/read-large-text-files-in-nodejs
             */
            let instream = fs.createReadStream(filePath);
            let rl = readline.createInterface(instream, process.stdout);
            let lineNum = 0;

            let promises: Promise<[String | Buffer, String]>[] = [];

            /**
             * Setting up event to read the file.
             * Todo: Populate a cache to prevent the same file getting read over and over.
             *      - Important due to a single file containing many modules or namespaces.
             */
            rl.on('line', line => {
                lineNum++;
                if (!lineStartAndEnd || (lineStartAndEnd[0] <= lineNum && lineStartAndEnd[1] >= lineNum)) {
                    let scanner = initScannerState(line);
                    let token = scanner.scan();
                    let tokenStart = scanner.getTokenPos();
                    while (token != ts.SyntaxKind.EndOfFileToken) {
                        if (token === ts.SyntaxKind.Identifier) {

                            // Tokens seem to start with whitespace. Adding one allows the definition to be found.
                            if (command == CommandMethodsFileScan.Definition) {
                                promises.push(this.lookUpDefinition(tssFilePath, lineNum, tokenStart + 1,
                                    {
                                        tokenText: scanner.getTokenText(),
                                        tokenType: ts.SyntaxKind[token],
                                        filePath: filePath
                                    }));

                            } else if (command == CommandMethodsFileScan.References) {
                                promises.push(this.lookUpReferences(tssFilePath, lineNum, tokenStart + 1,
                                    {
                                        tokenText: scanner.getTokenText(),
                                        tokenType: ts.SyntaxKind[token],
                                        filePath: filePath
                                    }));
                            }
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
                return Promise.all(promises).then(function () {
                    /**
                     * Arguments are all here in arguments[0], arguments[1].....
                     * Thank you: http://stackoverflow.com/a/10004137
                     */
                    for (let i = 0; i < arguments.length; i++) {
                        winston.log('silly', `ARGUMENTS: ${arguments[i]}`);
                        results.push(arguments[i]);
                    }
                    winston.log('verbose', `RESULTS: ${results}`);
                    // Results somehow ends up as a type string[][][], with the first index being everything we want.
                    // TODO: work out why we get a string[][][]!?
                    return callback(null, results[0]);
                }).catch(err => { winston.log("error", `Promise error: ${err}`) });
            });
        }).catch(function (err) {
            winston.log('error', `Error in ScanFileBetweenWorker: ${err}`);
        });

    }

    /**
     * Function to call when using api.
     * Returns list of requests and responses containing information about all the tokens.
     */
    scanFileForAllTokens = (filePath: string, callback: (err: Error, locations: string[][]) => void) => {
        this.scanFileForAllTokensBetween(filePath, null, callback);
    }

    /**
     * Worker which scans the file and returns all the text with tokens.
     */
    scanFileForAllTokensBetween = (filePath: string, lineStartAndEnd: [number, number], callback: (err: Error, locations: string[][]) => void) => {
        return Promise.resolve().then(() => {
        /**
         * Below code doesn't use root of directory as reference.
         * TODO: make sure this path reflects the root of the directory we are trying to traverse.
         * Answer here: http://stackoverflow.com/a/18721515
         */

        winston.log("trace", `Running scanFileForAllTokensBetween with args: ${arguments}`)

        /**
         * Below code doesn't use root of directory as reference.
         * 
         * Modified using answer: http://stackoverflow.com/a/18721515
         */
        let appDir = path.dirname(require.main.filename);
        filePath = appDir + '/' + filePath;
        let tssFilePath = filePath;
        if (!fs.existsSync(filePath)) {
            winston.log("debug", `File doesn't exist: ${filePath}`);
            return callback(new Error(`File doesn't exist: ${filePath}`), null);
        }
        winston.log("debug", `function scanFile accessed ${filePath}`);


        let results: string[][][] = [];
        this.open(filePath, function (err, response: string) {
            if (err) {
                winston.log('error', `Error opening file: ${err}`);
                return callback(new Error(`Error opening file: ${err}`), null);
            }
            winston.log("verbose", `OPEN ${filePath}: ${response}`);
        });


        /**
         * Reading file from:
         * https://coderwall.com/p/ohjerg/read-large-text-files-in-nodejs
         */
        let instream = fs.createReadStream(filePath);
        let rl = readline.createInterface(instream, process.stdout);
        let lineNum = 0;

        let promises: Promise<[String | Buffer, String]>[] = [];

        /**
         * Setting up event to read the file.
         * Todo: Populate a cache to prevent the same file getting read over and over.
         *      - Important due to a single file containing many modules or namespaces.
         */
        rl.on('line', line => {
            lineNum++;
            if (!lineStartAndEnd || (lineStartAndEnd[0] <= lineNum && lineStartAndEnd[1] >= lineNum)) {
                let scanner = initScannerState(line);
                let token = scanner.scan();
                let tokenStart = scanner.getTokenPos();
                while (token != ts.SyntaxKind.EndOfFileToken) {
                    winston.log("trace", `Iterating tokens at position (${lineNum}, ${tokenStart})`)
                    if (token === ts.SyntaxKind.Identifier) {
                        // Tokens seem to start with whitespace. Adding one allows the definition to be found.
                        promises.push(this.lookUpReferences(tssFilePath, lineNum, tokenStart + 1,
                            {
                                tokenText: scanner.getTokenText(),
                                tokenType: ts.SyntaxKind[token],
                                filePath: filePath
                            }));
                    } else {
                        promises.push(this.addToken(lineNum, tokenStart + 1,
                            {
                                tokenText: scanner.getTokenText(),
                                tokenType: ts.SyntaxKind[token],
                                filePath: filePath
                            }))
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
            return Promise.all(promises).then(function(...responses) {
                /**
                 * Arguments are all here in arguments[0], arguments[1].....
                 * Thank you: http://stackoverflow.com/a/10004137
                 */
                for (let i = 0; i < responses.length; i++) {
                    winston.log('silly', `ARGUMENTS: ${responses[i]}`);
                    results.push(responses[i]);
                }
                winston.log('verbose', `RESULTS: ${results}`);
                // Results somehow ends up as a type string[][][], with the first index being everything we want.
                // TODO: work out why we get a string[][][]!?
                return callback(null, results[0]);
            }).catch(err => { winston.log("error", `Promise error: ${err}`) });
        });
        }).catch(err => {
            winston.log('error', `scanFileForAllTokensBetween failed: ${err}`);
        })

    }

    /**
     * Uses the filepath, sourceFile and position to look up a definition.
     * Returns a promise.
     */
    lookUpDefinition(filePath: string, lineNum: number, tokenOffset: number, reqBody: RequestBody) {
        return new Promise<[string | Buffer, string]>((fulfill, reject) => {
            this.definition(filePath, lineNum, tokenOffset, function (err, res, req) {
                if (err) reject(err);
                else fulfill([mergeRequestWithBody(req, reqBody), res]);
            });
        });
    };

    /**
     * Uses the filepath, sourceFile and position to look up a definition.
     * Returns a promise.
     */
    lookUpReferences(filePath: string, lineNum: number, tokenOffset: number, reqBody: RequestBody) {
        return new Promise<[string | Buffer, string]>((fulfill, reject) => {
            this.references(filePath, lineNum, tokenOffset, function (err, res, req) {
                if (err) reject(err);
                else fulfill([mergeRequestWithBody(req, reqBody), res]);
            });
        });
    };

    /**
     * This function does a fake promise in order to comply with the other functions.
     * This is the function run on a non identifier token. Storing data for syntax highlighting.
     */
    addToken(lineNum: number, tokenOffset: number, reqBody: RequestBody) {
        return new Promise<[string | Buffer, string]>((fullfill, reject) => {
            let req = {
                command: "addToken",
                body: reqBody
            };

            let res = {
                type: "response",
                success: true,
                body: {
                    start: {
                        line: lineNum,
                        offset: tokenOffset
                    }

                }
            }
            fullfill([JSON.stringify(req), JSON.stringify(res)]);

        })
    }

}


/**
 * This is the point at which we can add as much as we want to the request.
 */
function mergeRequestWithBody(req: string, body: RequestBody): string {
    let newReq = JSON.parse(req);
    newReq.body = body;
    return JSON.stringify(newReq);
}

function initScannerState(text: string): ts.Scanner {
    // TODO: scanner matches tsconfig.
    let scanner = ts.createScanner(ts.ScriptTarget.Latest, true);
    scanner.setText(text);
    scanner.setOnError((message, length) => {
        winston.error(`${message}`);
    });
    // TODO: match with users tsconfig.json
    scanner.setScriptTarget(ts.ScriptTarget.ES5);
    // TODO: match variant with tsconfig.json
    scanner.setLanguageVariant(ts.LanguageVariant.Standard);
    return scanner;
}



/**
 * Reference calls have this shape:
 * {"seq":0,"type":"response","command":"references","request_seq":3,"success":true,"body":{"refs":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex2.ts","start":{"line":2,"offset":10},"lineText":"function findMe(){","end":{"line":2,"offset":16},"isWriteAccess":true,"isDefinition":true},{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex2.ts","start":{"line":9,"offset":1},"lineText":"findMe();","end":{"line":9,"offset":7},"isWriteAccess":false,"isDefinition":false}],"symbolName":"findMe","symbolStartOffset":1,"symbolDisplayString":"function findMe(): void"}}
 * 
 * 
 */
//              {
//                  command: "addToken",
//                 body: {
//                      tokenText and tokenType
//                       }
//             };

//             {
//                 type: "response",
//                 success: true,
//                 body: {
//                     start: {
//                         line: lineNum,
//                         offset: tokenOffset
//                     }

export function combineRequestReturn(reqRes: string[][]){
    winston.log('trace', `combineRequestReturn called with ${reqRes}`);
    let combined = [];
    let request, response;
    for (let i = 0; i < reqRes.length; i ++){
        request = JSON.parse(reqRes[i][0]);
        response = JSON.parse(reqRes[i][1])
        if (request.command === "addToken") {
            combined.push(compressAddToken(request, response))
        } else if (request.command == "references") {
            combined.push(compressReferencesToken(request, response));
        }
    }
    winston.log('trace', `combineRequestReturn called with ${reqRes}`);
    return 
}

function compressAddToken(request, response){
    return {
        tokenText: request.body.tokenText,
        tokenType: request.body.tokenType,
        isDefinition: false,
        start: response.body.start
    }
}

function compressReferencesToken(request, response){
    let compressedReference =  {
        tokenText: request.body.tokenText,
        tokenType: request.body.tokenType,
        isDefinition: false,                // By default initialized as false. TODO: Needs to be checked from references.
        start: response.body.start,
        file: request.body.filePath,
        references: response.body.refs      // Technically only need: file, start, isDefinition.
    }

    /** TODO: remove duplicate reference.
     *      - check if token is definition.
     *      - If it is, call definition and get end length.
     */

    return compressedReference
}

/* @internal */
// Exposed for testing.
export function removeDuplicateReference(compressedReference){
    // Will need to compare file paths.
    let thisNodeFilePath = compressedReference.file;
    let thisNodeStart = compressedReference.start;

    let referenceList = compressedReference.references;


}