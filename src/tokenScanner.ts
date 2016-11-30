import * as fs from "fs";
import * as ts from "TypeScript";
import {Tsserver} from "./tsserverWrap"

/**
 * Always takes file paths from root of project directory.
 */
export function scanFile(filePath: string, callback: (err: Error, locations: string[])=>void){
    /**
     * Below code doesn't use root of directory as reference.
     */
    // if (!fs.exists(filePath)){
    //     console.error("File doesn't exist");
    //     return;
    // }
    // TODO: Fix assumption that file exists.


    let text = fs.readFileSync(filePath);
    
    // TODO: match target with users tsconfig.json
    let scanner = ts.createScanner(ts.ScriptTarget.Latest, true);
    initScannerState(text.toString());

    // TODO: match config with tsconfig
    // Creates file source interface to use with line/offset function below.
    let fileSourceFile = ts.createSourceFile(filePath, text.toString(), ts.ScriptTarget.Latest);

    let results = [];
    let tsserver = new Tsserver();
    tsserver.open(filePath, function(err, response: string){
        // Probably want to check for success here.
        // TODO: add error handling.
        console.log(`OPEN ${filePath}: ${response.toString()}`);
    });

    // Now we can scan all the tokens
    let token = scanner.scan();

    let promises: Promise<String | Buffer>[] = [];

    while (token != ts.SyntaxKind.EndOfFileToken){
        let currentToken = token;
        let tokenStart = scanner.getStartPos();
        token = scanner.scan();
        let tokenEnd = scanner.getStartPos();
        if (currentToken === ts.SyntaxKind.Identifier){
            promises.push(lookUpDefinition(filePath, fileSourceFile, tsserver, tokenStart));
        }
        // console.log(currentToken, tokenStart, tokenEnd);
    }
    // TODO: This has to wait for the promises to resolve.
    Promise.all(promises).then(function(){
        // Arguments are all here in arguments[0], arguments[1].....
        // Thank you: http://stackoverflow.com/a/10004137
        for (let i = 0; i < arguments.length; i++){
            results += arguments[i];
        }
        callback(null, results);
    }, function(err){
        console.error(err);
    });

    function initScannerState(text: string){
        scanner.setText(text);
        scanner.setOnError((message, length)=>{
            console.error(message);
        });
        // TODO: match with users tsconfig.json
        scanner.setScriptTarget(ts.ScriptTarget.ES5);
        // TODO: match variant with tsconfig.json
        scanner.setLanguageVariant(ts.LanguageVariant.Standard);
    }

    /**
     * Uses the filepath, sourceFile, tsserver and position to look up a definition.
     * Returns a promise.
     */
    function lookUpDefinition(filePath: string, fileSource: ts.SourceFile, tsserver: Tsserver, tokenPos: number){
        return new Promise<string | Buffer>(function(fulfill, reject){
            // Functions source located: https://github.com/Microsoft/TypeScript/blob/master/src/compiler/scanner.ts#L362
            let {line, character} = ts.getLineAndCharacterOfPosition(fileSourceFile, tokenPos);
            console.log(line, character);
            tsserver.definition(filePath, line + 1, character, function(err, res){
                if (err) reject(err);
                else fulfill(res);
            });
        });
    }
}
