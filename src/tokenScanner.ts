import * as fs from "fs";
import * as readline from "readline";
import* as path from "path";

import * as ts from "TypeScript";
import {Tsserver} from "./tsserverWrap";

export function scanFile(filePath: string, callback: (err: Error, locations: string[])=>void){
    scanFileBetween(filePath, [null,null],  callback);
}


/**
 * Always takes file paths from root of project directory.
 */
export function scanFileBetween(filePath: string, lineStartAndEnd: [number, number], callback: (err: Error, locations: string[])=>void){
    /**
     * Below code doesn't use root of directory as reference.
     * TODO: make sure this path reflects the root of the directory we are trying to traverse.
     * Answer here: http://stackoverflow.com/a/18721515
     */
    let appDir = path.dirname(global.appRoot);
    filePath = appDir + '/' + filePath;
    let tssFilePath = filePath;
    if (!fs.existsSync(filePath)){
        callback(new Error(`File doesn't exist: ${filePath}`), null);
        return;
    }


    let results = [];
    let tsserver = new Tsserver();
    tsserver.open(filePath, function(err, response: string){
        // Probably want to check for success here.
        // TODO: add error handling.
        console.log(`OPEN ${filePath}: ${response}`);
    });


    /**
     * Reading file from:
     * https://coderwall.com/p/ohjerg/read-large-text-files-in-nodejs
     */
    let instream = fs.createReadStream(filePath);
    let rl = readline.createInterface(instream, process.stdout);
    let lineNum = 0;
    
    let promises: Promise<String | Buffer>[] = [];

    rl.on('line', function(line){
        lineNum ++;
        let scanner = initScannerState(line);
        let token = scanner.scan();
        let tokenStart = scanner.getTokenPos();
        while (token != ts.SyntaxKind.EndOfFileToken){
            if (token === ts.SyntaxKind.Identifier){
                // console.log(`${scanner.getTokenText()} at (${lineNum}, ${tokenStart + 1})`);
                promises.push(lookUpDefinition(tssFilePath, tsserver,lineNum, tokenStart + 1));
            }
            token = scanner.scan();
            tokenStart = scanner.getTokenPos();
        }
    });

    rl.on('close', function(){
        Promise.all(promises).then(function(){
            // Arguments are all here in arguments[0], arguments[1].....
            // Thank you: http://stackoverflow.com/a/10004137
            for (let i = 0; i < arguments.length; i++){
                results.push(arguments[i]);
            }
            callback(null, results);
        }, function(err){
            console.error(err);
        });
    })

    function initScannerState(text: string): ts.Scanner{
        // TODO: scanner matches tsconfig.
        let scanner = ts.createScanner(ts.ScriptTarget.Latest, true);
        scanner.setText(text);
        scanner.setOnError((message, length)=>{
            console.error(message);
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
    function lookUpDefinition(filePath: string, tsserver: Tsserver, lineNum:number, tokenPos: number){
        return new Promise<string | Buffer>(function(fulfill, reject){
            tsserver.definition(filePath, lineNum, tokenPos, function(err, res){
                if (err) reject(err);
                else fulfill(res);
            });
        });
    }
}
