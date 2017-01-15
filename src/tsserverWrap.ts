/**
 * Author: Andrew Jakubowicz
 *
 * This module exposes some of the funcitonality of the tsserver.
 */

// Reference the protocol.d.ts used by tsserver
/// <reference path="../node_modules/typescript/lib/protocol.d.ts" />

import * as path from "path";
import * as fs from "fs";
import * as ts from "TypeScript";

import * as child_process from "child_process";

import * as winston from "./appLogger";

import {TransformSplitResponseStream, WriteStream} from "./util/customStreams";

import {languageServiceHost} from './languageService';


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

    private tsserverProcess: child_process.ChildProcess;

    // Required to be sent into the tsserver.
    // Increments with each new command.
    private seq: number = 0;

    // Stores the promises.
    private responseCallbackStore = [];

    constructor() {

        const args = [
            "node_modules/typescript/bin/tsserver"
        ];

        this.tsserverProcess = child_process.spawn("node", args);


        let splitStream = new TransformSplitResponseStream();
        let writingStream = new WriteStream(this.responseCallbackStore);
        

        // Piping output from tsserver.
        this.tsserverProcess.stdout.pipe(splitStream).pipe(writingStream);

        this.tsserverProcess.stderr.on('data', d => {
            winston.log('error', 'tsserverProcess error:', d);
        });
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
        return sendCommand(commandObj, this.responseCallbackStore, this.tsserverProcess);
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
        return sendCommand(commandObj, this.responseCallbackStore, this.tsserverProcess);
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
        return sendCommand(commandObj, this.responseCallbackStore, this.tsserverProcess);
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
        return sendCommand(commandObj, this.responseCallbackStore, this.tsserverProcess);
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
        return sendCommand(commandObj, this.responseCallbackStore, this.tsserverProcess);
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
        return sendCommand(commandObj, this.responseCallbackStore, this.tsserverProcess);
    }

    killServer() {
        this.tsserverProcess.kill();
    }

}


