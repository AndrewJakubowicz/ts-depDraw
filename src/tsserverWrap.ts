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
import * as assert from 'assert';

import * as child_process from "child_process";

import * as winston from "./appLogger";

import {TransformSplitResponseStream, WriteStream} from "./util/customStreams";

import {navTreeOnFile} from './languageService';




/**
 * CACHE for the file tokens.
 */
let FILE_TOKENS_ARRAY: Map<string,any> = new Map();

/** What files has tsserver opened */
let OPENED_FILES: Map<string,boolean> = new Map();



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
            winston.log('error', `tsserverProcess error: ${d.toString()}`);
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
