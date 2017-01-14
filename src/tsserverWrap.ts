/**
 * Author: Andrew Jakubowicz
 *
 * This module exposes some of the funcitonality of the tsserver.
 */

// Reference the protocol.d.ts used by tsserver
/// <reference path="../node_modules/typescript/lib/protocol.d.ts" />

import * as path from "path";
import * as fs from "fs";
import * as assert from "assert";
import * as ts from "TypeScript";

import * as child_process from "child_process";

import * as winston from "./appLogger";
import * as jsonUtil from './util/jsonUtil';

// imports for new code
import {TransformStream, WriteStream} from "./util/customStreams";


// Function that sends a command object and returns a promise.
// Mutates a callbackStore.
const sendCommand = (command, callbackStore, childProcess) => {
    winston.log('trace', 'sendingCommand:', command);
    return new Promise((fulfill, reject) => {
            callbackStore.push((err, response) => {
                if (err) {
                    reject(err);
                }
                console.log("Fulfilling promise");
                fulfill(response)
            });
            
            childProcess.stdin.write(JSON.stringify(command) + '\n');

        });
}

export class TsserverWrapper {
    private proc: child_process.ChildProcess;
    private seq: number = 0;

    private responseCallbackStore = [];

    constructor() {
        console.log("Spawning tsserver");
        const args = [
            "node_modules/typescript/bin/tsserver"
        ];

        this.proc = child_process.spawn("node", args);

        let doublingStream = new TransformStream();
        let writingStream = new WriteStream(this.responseCallbackStore);
        
        // What happens to the output from the 
        this.proc.stdout.pipe(doublingStream).pipe(writingStream);
        this.proc.stderr.on('data', d => {
            console.log('stderr:', d);
        })
    }

    open(filePath: string) {

        // Todo: revisit the scriptKindName property.
        let OpnCommand: protocol.OpenRequest = {
            command: "open",
            seq: this.seq,
            type: "request",
            arguments: (<protocol.OpenRequestArgs>{
                // scriptKindName: "JS",
                file: filePath
            })
        }

        this.seq ++;
        return sendCommand(OpnCommand, this.responseCallbackStore, this.proc);
    }

    quickinfo(filePath: string, lineNumber: number, offset: number) {
        let commandObj = {
            seq: this.seq,
            type: "request",
            command: "quickinfo",
            arguments: {
                file: filePath,
                line: lineNumber,
                offset: offset
            }
        }

        this.seq ++;
        return sendCommand(commandObj, this.responseCallbackStore, this.proc);
    }

    definition(filePath: string, lineNumber: number, offset: number) {
        let commandObj = {
            seq: this.seq,
            type: "request",
            command: "definition",
            arguments: {
                file: filePath,
                line: lineNumber,
                offset: offset
            }
        }

        this.seq ++;
        return sendCommand(commandObj, this.responseCallbackStore, this.proc);
    }

}


/**
 * Wrapper for tsserver.
 *
 *          - TODO: Make sure seq and req_seq are always the same.
 */
export class Tsserver {
    private proc : child_process.ChildProcess;
    private operations : [
        ((err : Error, response : string | Buffer, request : string) => void),
        string
    ][] = [];
    private seq : number = 0; // tsserver requires everything to have a sequence number.

    /**
     * Spawns tsserver singleton and awaits events.
     */
    constructor() {

        this.proc = child_process.exec('tsserver');

        /**
         * This has to be able to handle batch responses.
         * Therefore it splits up the response and then process them individually.
         */
        this
            .proc
            .stdout
            .on("data", d => {
                winston.log('debug', `TSSERVER OUT: "${d}"`);

                // Split and filter out the stuff that isn't needed.
                let allData = d
                    .toString()
                    .split(/\r\n|\n/)
                    .filter(v => {
                        console.log(v);
                        return !(v === '' || v.slice(0, 14) === 'Content-Length')
                    });

                // Grab first callback and data.
                let callback,requestText,chunk;


                while (allData.length > 0) {
                    winston.log("debug", `Tsserver response: Checking lengths of operations vs callbacks: (${allData.length} == ${this.operations.length})`);
                    if (allData.length !== this.operations.length) {
                        winston.debug(`Tsserver response: Checking lengths of operations vs callbacks: (${allData.length} == ${this.operations.length})`, allData, this.operations);
                    }
                    
                    [callback, requestText] = this
                        .operations
                        .shift();
                    chunk = allData.shift();

                    winston.log('trace', `Chunk response and request`, chunk, requestText);

                    // Added middleware to catch open call.
                    // TODO: work on this.
                    // winston.log('error', `What is this`, requestText, typeof requestText);
                    // winston.log('error', `What is this`, jsonUtil.parseEscaped(requestText));
                    // let command = jsonUtil.parseEscaped(requestText)
                    // if (command.success && command.command === 'open' && !OPENED_FILES.has(command.arguments.file)){
                    //     winston.log('warn', `Successful open of file:`, command.arguments.file);
                    //     OPENED_FILES.set(command.arguments.file, true);
                    // }

                    callback(null, chunk, requestText);
                }
            });

        /**
         * Not actually sure if this will ever call.
         * I think tsserver responds with success: false in the case of error.
         */
        this
            .proc
            .stderr
            .on("data", d => {
                winston.log("error", `TSSERVER ERR: ${d}`);
                let [callback,
                    command] = this
                    .operations
                    .shift();
                callback(new Error(d.toString()), null, command);
            });

        this
            .proc
            .on('close', (err, code) => {
                winston.log("debug", `TSSERVER QUIT: ${code}`);
            });
    }

    /**
     * Implements allows use of implements.
     */
    implements(filePath : string, line : number, column : number, callback : (err : Error, response : string, request : string) => void) {
        let commandObj : LookupCommand = {
            seq: this.seq,
            type: "request",
            command: "implementation",
            arguments: {
                file: path.join(filePath),
                line: line,
                offset: column
            }
        }
        let command = JSON.stringify(commandObj);
        winston.log("data", `SENDING TO TSSERVER: "${command}"`);
        this
            .proc
            .stdin
            .write(command + '\n');
        this
            .operations
            .push([callback, command]);
        this.seq++;
    }

    /**
     * navtree allows use of navtree.
     */
    navtree(filePath : string, callback : (err : Error, response : string, request : string) => void) {
        let commandObj = {
            seq: this.seq,
            type: "request",
            command: "navtree",
            arguments: {
                file: path.join(filePath)
            }
        }
        let command = JSON.stringify(commandObj);
        winston.log("data", `SENDING TO TSSERVER: "${command}"`);
        this
            .proc
            .stdin
            .write(command + '\n');
        this
            .operations
            .push([callback, command]);
        this.seq++;
    }

    /**
     * quickinfo implements quickinfo in tsserver protocol.
     */
    quickinfo(filePath : string, line : number, column : number, callback : (err : Error, response : string, request : string) => void) {
        let commandObj : LookupCommand = {
            seq: this.seq,
            type: "request",
            command: "quickinfo",
            arguments: {
                file: path.join(filePath),
                line: line,
                offset: column
            }
        }
        let command = JSON.stringify(commandObj);
        winston.log("data", `SENDING TO TSSERVER: "${command}"`);
        this
            .proc
            .stdin
            .write(command + '\n');
        this
            .operations
            .push([callback, command]);
        this.seq++;
    }

    /**
     * Allows goto definition using tsserver.
     * This will store a callback on the FIFO queue.
     * If you don't open the file before trying to find definitions in it, this will fail.
     */
    definition(filePath : string, line : number, column : number, callback : (err : Error, response : string, request : string) => void) {
        let commandObj : LookupCommand = {
            seq: this.seq,
            type: "request",
            command: "definition",
            arguments: {
                file: path.join(filePath),
                line: line,
                offset: column
            }
        }
        let command = JSON.stringify(commandObj);
        winston.log("data", `SENDING TO TSSERVER: "${command}"`);
        this
            .proc
            .stdin
            .write(command + '\n');
        this
            .operations
            .push([callback, command]);
        this.seq++;
    }

    /**
     * Returns a response showing what implements something.
     */
    references(filePath : string, line : number, column : number, callback : (err : Error, response : string, request : string) => void) {
        let commandObj : LookupCommand = {
            seq: this.seq,
            type: "request",
            command: "references",
            arguments: {
                file: path.join(filePath),
                line: line,
                offset: column
            }
        }
        let command = JSON.stringify(commandObj);
        winston.log("data", `SENDING TO TSSERVER: "${command}"`);
        this
            .proc
            .stdin
            .write(command + '\n');
        this
            .operations
            .push([callback, command]);
        this.seq++;
    }

    open(filePath : string, callback : (err : Error, response : string, request : string) => void) {
        let command = `{"seq":${this
            .seq},"type":"request","command":"open","arguments":{"file":"${path
            .join(filePath)}"}}\n`;
        winston.log("data", `SENDING TO TSSERVER: "${command}"`);
        this
            .proc
            .stdin
            .write(command);
        this
            .operations
            .push([callback, command]);
        this.seq++;
    }

    kill() {
        winston.log("trace", `TSSERVER SENDING QUIT REQUEST`);
        this
            .proc
            .kill();
    }

    /**
     * getTokenDependencies gets dependencies based on type.
     * 
     * Modules get module level dependencies. Functions get inner scope and module dependency.
     */
    getTokenDependencies(filePath: string, line: number, offset: number) {

    }

    /**
     * Uses the filepath, sourceFile and position to look up a definition.
     * Returns a promise.
     */
    lookUpDefinition(filePath : string, lineNum : number, tokenOffset : number, reqBody : RequestBody) {
        return new Promise < [
            string | Buffer,
            string
        ] > ((fulfill, reject) => {
            this
                .definition(filePath, lineNum, tokenOffset, function (err, res, req) {
                    if (err) 
                        reject(err);
                    else 
                        fulfill([
                            mergeRequestWithBody(req, reqBody),
                            res
                        ]);
                    }
                );
        });
    };

    /**
     * Uses the filepath, sourceFile and position to look up a definition.
     * Returns a promise.
     */
    lookUpReferences(filePath : string, lineNum : number, tokenOffset : number, reqBody : RequestBody) {
        return new Promise < [
            string | Buffer,
            string
        ] > ((fulfill, reject) => {
            this.references(filePath, lineNum, tokenOffset, (err, res, req) => {
                if (err) 
                    reject(err);
                else 
                    fulfill([
                        mergeRequestWithBody(req, reqBody),
                        res
                    ]);
                }
            );
        });
    };

    /**
     * This function does a fake promise in order to comply with the other functions.
     * This is the function run on a non identifier token. Storing data for syntax highlighting.
     */
    addToken(lineNum : number, tokenOffset : number, reqBody : RequestBody) {
        return new Promise < [
            string | Buffer,
            string
        ] > ((fullfill, reject) => {
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
            fullfill([
                JSON.stringify(req),
                JSON.stringify(res)
            ]);

        })
    }

    /**
     * addEndPosition adds an end Position to defined tokens.
     * definedStart
     * definedEnd
     * Assumes that the file has already been opened in tsserver.
     */
    addEndPosition(token : TokenIdentifierData, filePath : string) {
        winston.log('trace', `addEndPosition method used for token:`, token);
        if (!token.isDefinition) {
            return Promise.resolve(token);
        }
        return new Promise < TokenIdentifierData > ((fulfill, reject) => {
            this
                .definition(filePath, token.start.line, token.start.offset, function (err, res, req) {
                    if (err) 
                        reject(err);
                    else 
                        return fulfill(JSON.parse(res));
                    }
                );
        }).then(definitionResponse => {
            winston.log('debug', `definitionResponse = `, definitionResponse)
            token.definedEnd = definitionResponse.body[0].end;
            token.definedStart = definitionResponse.body[0].start;
            token.definedFile = definitionResponse.body[0].file;
            winston.log('debug', `Modified token:`, token);
            return token
        }).catch(err => {
            winston.log('error', `addEndPosition failed with ${err}`);
        });
    }

    /**
     * Internal use: Use scanFileForAllTokensPretty instead.
     *
     * This function takes a list of request/responses and cleans the data.
     * In future optimizations it would be good not to have this bottleneck.
     */
    combineRequestReturn(reqRes : string[][]) {
        winston.log('trace', `combineRequestReturn called with ${reqRes}`);
        let combined : Promise < TokenData | TokenIdentifierData > [] = [];
        let request,
            response;
        for (let i = 0; i < reqRes.length; i++) {
            request = JSON.parse(reqRes[i][0]);
            response = JSON.parse(reqRes[i][1])
            if (!response.success) {
                combined.push(compressFailedToken(request, response))
            } else if (request.command === "addToken") {
                combined.push(compressAddToken(request, response))
            } else if (request.command == "references") {
                combined.push(this.addEndPosition(compressReferencesToken(request, response), request.body.filePath));
            } else {
                winston.log('error', `Tokens are falling through!!!!`);
            }
        }
        winston.log('trace', `combineRequestReturn called with ${reqRes}`);
        return Promise.all(combined);
    }

}

/**
 * This is the point at which we can add as much as we want to the request.
 */
function mergeRequestWithBody(req : string, body : RequestBody) : string {
    let newReq = JSON.parse(req);
    newReq.body = body;
    return JSON.stringify(newReq);
}

/**
 * This is the very tiny token that is created for failed lookups.
 *
 * These are mostly comments.
 */
function compressFailedToken(request, response) {
    return new Promise < TokenData > ((fullfill, reject) => {
        fullfill({tokenText: request.body.tokenText, tokenType: request.body.tokenType, start: null});
    });
}

function compressAddToken(request, response) {
    return new Promise < TokenData > ((fullfill, reject) => {
        fullfill({tokenText: request.body.tokenText, tokenType: request.body.tokenType, start: response.body.start});
    });
}

export interface Position {
    line : number
    offset : number
}

export interface TokenData {
    tokenText : string
    tokenType : string
    start : Position
}

/**
 * This is the data stored by all tokens which can have dependencies.
 */
export interface TokenIdentifierData extends TokenData {
    isDefinition : boolean
    definedEnd?: Position
    definedStart?: Position
    definedFile?: string
    references : any[]
}

/**
 * Must be passed a valid javascript object.
 *  Creates token. Then removes itself from the tokens all references list.
 *  Updates its own isDefinition by looking at the all references list.
 */
export function compressReferencesToken(request, response) {
    assert.notEqual(typeof request, 'string', `compressReferencesToken must be passed an object`);
    let currentFile = request.body.filePath;
    let referenceToken = createReferenceToken(request, response);
    referenceToken = removeDuplicateReference(referenceToken, currentFile)
    return referenceToken
}

export function createReferenceToken(request, response) : TokenIdentifierData {
    // If success failed then it's a comment or useless.
    if(!response.success) {
        winston.log('error', `
Something has gone fatally wrong.
Token must be successful to be passed into createReferenceToken.`.trim());
    }
    assert.ok(request.body.tokenText, "Token text is required in request");
    assert.ok(request.body.tokenType, "Token type is required in request");
    assert.ok(request.arguments.line, "Token line is required in request");
    assert.ok(request.arguments.offset, "Token offset is required in request");
    return {
        tokenText: request.body.tokenText, tokenType: request.body.tokenType, isDefinition: false, // By default initialized as false. TODO: Needs to be checked from references.
        start: {
            line: request.arguments.line,
            offset: request.arguments.offset
        },
        references: response.body.refs // Technically only need: file, start, isDefinition.
    }
}

/**
 * removeDuplicateReference cleans up the token data.
 * Compares file paths
 */
export function removeDuplicateReference(compressedReference : TokenIdentifierData, relFilePath : string) {
    let thisNodeStart = compressedReference.start;
    let referenceList = compressedReference.references;
    let splitIndex : number;
    for (let i = 0; i < referenceList.length; i++) {
        if (comparePosition(referenceList[i].start, thisNodeStart) && comparePath(referenceList[i].file, relFilePath)) {
            splitIndex = i;
            break;
        }
    }

    let cutoutReference = referenceList.splice(splitIndex, 1);
    compressedReference.isDefinition = cutoutReference[0].isDefinition;

    return compressedReference;

    function comparePosition(a, b) {
        return a.line === b.line && a.offset === b.offset;
    }
    function comparePath(absPath : string, relPath : string) : boolean {
        winston.log('trace', `Comparing ${absPath.slice(-1 * relPath.length)} === ${relPath}`);
        return absPath.slice(-1 * relPath.length) === relPath;
    }
}

/**
 * Function for initialising the scanner.
 */
function initScannerState() : ts.Scanner {
    // TODO: scanner matches tsconfig.
    let scanner = ts.createScanner(ts.ScriptTarget.Latest, false);
    scanner.setOnError((message, length) => {
        winston.warn(`${JSON.stringify(message)}`);
    });
    // TODO: match with users tsconfig.json
    scanner.setScriptTarget(ts.ScriptTarget.ES5);
    // TODO: match variant with tsconfig.json
    scanner.setLanguageVariant(ts.LanguageVariant.Standard);
    return scanner;
}


/**
 * scanFileForIdentifierTokens returns an array of all the tokens in the file.
 * 
 * This can be used to recreate the file in some sort of interface, with enough information
 * to hook up commands to the identifier tokens.
 */
export function scanFileForIdentifierTokens (filePath : string) : Promise < any > {
    return new Promise((resolve, reject) => {

        // Get tokens from cache if exists.
        winston.log('debug', `Checking if cache exists for file ${filePath}.`, FILE_TOKENS_ARRAY);
        if (FILE_TOKENS_ARRAY.has(filePath)){
            winston.log('debug', `cache found. Resolving with: `, FILE_TOKENS_ARRAY.get(filePath));
            return resolve(FILE_TOKENS_ARRAY.get(filePath));
        }


        winston.log("trace", `Running scanFileForIdentifierTokens on ${filePath}`);

        /**
         * Below code doesn't use root of directory as reference.
         *
         * Modified using answer: http://stackoverflow.com/a/18721515
         */
        try {
            assert.ok(global.tsconfigRootDir, "Global object tsconfigRootDir must be set.");
        } catch (err) {
            return reject(new Error(`tsconfig root directory not set: ${err}`));
        }

        // Grabbing to root path.
        let appDir = global.tsconfigRootDir;
        let tssFilePath = filePath;
        filePath = path.join(appDir, filePath);

        if (!fs.existsSync(filePath)) {
            winston.log("debug", `File doesn't exist: ${filePath}`);
            return reject(new Error(`File doesn't exist: ${filePath}`));
        }

        winston.log("debug", `Accessed ${filePath}.`);

        // Read file and scan for tokens.
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                return reject(new Error(`Failed to read file for tokens: ${err}`));
            }
            let tokenResults = [];
            let scanner = initScannerState();

            // Create sourceFile for line Number and offset conversion.
            // Todo: link with tsconfig.
            let sourceFile = ts.createSourceFile(path.basename(filePath), data, ts.ScriptTarget.Latest)

            scanner.setText(data);
            let tokenPositionStart = ts.getLineAndCharacterOfPosition(sourceFile, scanner.getTextPos());
            let token = scanner.scan();
            let tokenDetails;

            while (token != ts.SyntaxKind.EndOfFileToken) {
                winston.log("trace", `Iterating tokens at position (${tokenPositionStart.line + 1}, ${tokenPositionStart.character})`);
                // Push the token onto the array.
                tokenPositionStart.line += 1;   // line number is 0 based.
                tokenPositionStart.character += 1;
                tokenDetails = {
                    text: scanner.getTokenText(),
                    type: ts.SyntaxKind[token],
                    start: tokenPositionStart
                }
                tokenResults.push(tokenDetails);

                // Get the next token
                tokenPositionStart = ts.getLineAndCharacterOfPosition(sourceFile, scanner.getTextPos());
                token = scanner.scan();
            }

            // Store tokens in cache and return tokens. Just check that it still doesn't exist.
            winston.log('debug', `Checking cache for ${tssFilePath}`, FILE_TOKENS_ARRAY);
            if (!FILE_TOKENS_ARRAY.has(tssFilePath)){
                winston.log('debug', `Adding ${tssFilePath}.`);
                FILE_TOKENS_ARRAY.set(tssFilePath, tokenResults);
            }
            return resolve(tokenResults);
        });
    });
}