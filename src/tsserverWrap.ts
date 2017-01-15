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
                    return reject(err);
                }

                let responseObj;
                winston.log('trace', 'parsing response:', response);
                try {
                    responseObj = JSON.parse(response);
                }
                catch (err) {
                    winston.log('error', 'Parse of response failed:', response);
                    return reject(err)
                }

                return fulfill(responseObj)
            });
            
            childProcess.stdin.write(JSON.stringify(command) + '\n');

        });
}


/**
 * TsserverWrapper spins up a tsserver process and interacts using
 * the protocol.d.ts protocol. Each method defined returns a promise
 * returning an object.
 */
export class TsserverWrapper {
    private proc: child_process.ChildProcess;
    private seq: number = 0;

    private responseCallbackStore = [];

    constructor() {
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
        let commandObj: protocol.OpenRequest = {
            command: "open",
            seq: this.seq,
            type: "request",
            arguments: (<protocol.OpenRequestArgs>{
                // scriptKindName: "JS",
                file: filePath
            })
        }

        this.seq ++;
        return sendCommand(commandObj, this.responseCallbackStore, this.proc);
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

    references(filePath: string, lineNumber: number, offset: number) {
        let commandObj = {
            seq: this.seq,
            type: "request",
            command: "references",
            arguments: {
                file: filePath,
                line: lineNumber,
                offset: offset
            }
        }

        this.seq ++;
        return sendCommand(commandObj, this.responseCallbackStore, this.proc);
    }

    /**
     * Implementation returns the scope of the definition of the token.
     * 
     * returns object with property:
     *      body:[{"file":"",
     *             "start":{"line":7,"offset":1},
     *             "end":{"line":9,"offset":2}}]
     */
    implementation(filePath: string, lineNumber: number, offset: number) {
        let commandObj = {
            seq: this.seq,
            type: "request",
            command: "implementation",
            arguments: {
                file: filePath,
                line: lineNumber,
                offset: offset
            }
        }

        this.seq ++;
        return sendCommand(commandObj, this.responseCallbackStore, this.proc);
    }

    navtree(filePath: string) {
        let commandObj = {
            seq: this.seq,
            type: "request",
            command: "navtree",
            arguments: {
                file: path.join(filePath)
            }
        }

        this.seq ++;
        return sendCommand(commandObj, this.responseCallbackStore, this.proc);
    }

    killServer() {
        this.proc.kill();
    }

}




// /**
//  * Must be passed a valid javascript object.
//  *  Creates token. Then removes itself from the tokens all references list.
//  *  Updates its own isDefinition by looking at the all references list.
//  */
// export function compressReferencesToken(request, response) {
//     assert.notEqual(typeof request, 'string', `compressReferencesToken must be passed an object`);
//     let currentFile = request.body.filePath;
//     let referenceToken = createReferenceToken(request, response);
//     referenceToken = removeDuplicateReference(referenceToken, currentFile)
//     return referenceToken
// }

// export function createReferenceToken(request, response) : TokenIdentifierData {
//     // If success failed then it's a comment or useless.
//     if(!response.success) {
//         winston.log('error', `
// Something has gone fatally wrong.
// Token must be successful to be passed into createReferenceToken.`.trim());
//     }
//     assert.ok(request.body.tokenText, "Token text is required in request");
//     assert.ok(request.body.tokenType, "Token type is required in request");
//     assert.ok(request.arguments.line, "Token line is required in request");
//     assert.ok(request.arguments.offset, "Token offset is required in request");
//     return {
//         tokenText: request.body.tokenText, tokenType: request.body.tokenType, isDefinition: false, // By default initialized as false. TODO: Needs to be checked from references.
//         start: {
//             line: request.arguments.line,
//             offset: request.arguments.offset
//         },
//         references: response.body.refs // Technically only need: file, start, isDefinition.
//     }
// }

// /**
//  * removeDuplicateReference cleans up the token data.
//  * Compares file paths
//  */
// export function removeDuplicateReference(compressedReference : TokenIdentifierData, relFilePath : string) {
//     let thisNodeStart = compressedReference.start;
//     let referenceList = compressedReference.references;
//     let splitIndex : number;
//     for (let i = 0; i < referenceList.length; i++) {
//         if (comparePosition(referenceList[i].start, thisNodeStart) && comparePath(referenceList[i].file, relFilePath)) {
//             splitIndex = i;
//             break;
//         }
//     }

//     let cutoutReference = referenceList.splice(splitIndex, 1);
//     compressedReference.isDefinition = cutoutReference[0].isDefinition;

//     return compressedReference;

//     function comparePosition(a, b) {
//         return a.line === b.line && a.offset === b.offset;
//     }
//     function comparePath(absPath : string, relPath : string) : boolean {
//         winston.log('trace', `Comparing ${absPath.slice(-1 * relPath.length)} === ${relPath}`);
//         return absPath.slice(-1 * relPath.length) === relPath;
//     }
// }

