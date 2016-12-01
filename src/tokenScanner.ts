/**
 * Author: Andrew Jakubowicz
 */
import * as fs from "fs";
import * as readline from "readline";
import* as path from "path";
import * as winston from "winston";

import * as ts from "TypeScript";
import {Tsserver} from "./tsserverWrap";

// Sets logging based on environmental variable.
// TODO: replace static log level with changable one.
// winston.level = process.env.LOG_LEVEL;
winston.level = "verbose";
winston.setLevels({
  trace: 0,
  input: 1,
  verbose: 2,
  prompt: 3,
  debug: 4,
  info: 5,
  data: 6,
  help: 7,
  warn: 8,
  error: 9
});

winston.addColors({
  trace: 'magenta',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  debug: 'blue',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  error: 'red'
});

winston.remove(winston.transports.Console)
winston.add(winston.transports.Console, {
  level: 'trace',
  prettyPrint: true,
  colorize: true,
  silent: false,
  timestamp: false
});
// END WINSTON CONFIG

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
    winston.log("verbose", `function scanFile trying to access ${filePath}`);
    let tssFilePath = filePath;
    if (!fs.existsSync(filePath)){
        callback(new Error(`File doesn't exist: ${filePath}`), null);
        return;
    }


    let results: string[][][] = [];
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
        if (!lineStartAndEnd || (lineStartAndEnd[0] <= lineNum && lineStartAndEnd[1] >= lineNum)){
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
        }
    });

    rl.on('close', function(){
        Promise.all(promises).then(function(){
            // Arguments are all here in arguments[0], arguments[1].....
            // Thank you: http://stackoverflow.com/a/10004137
            
            for (let i = 0; i < arguments.length; i++){
                console.log(`ARGUMENTS: ${arguments[i]}`);
                results.push(arguments[i]);
            }
            tsserver.kill();
            console.log(`RESULTS: ${results}`);
            callback(null, results[0]);
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
        return new Promise<[string | Buffer, string]>(function(fulfill, reject){
            tsserver.definition(filePath, lineNum, tokenPos, function(err, res, req){
                if (err) reject(err);
                else fulfill([req, res]);
            });
        });
    }
}
