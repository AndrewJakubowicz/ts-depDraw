import * as fs from "fs";
import * as ts from "TypeScript";
import {Tsserver} from "./tsserverWrap"

/**
 * Always takes file paths from root of project directory.
 */
export function scanFile(filePath: string){
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

    let results = [];
    let tsserver = new Tsserver();
    tsserver.open(filePath, function(response: string){
        // Probably want to check for success here.
        console.log(`OPEN ${filePath}: ${response}`);
    });

    // Now we can scan all the tokens
    let token = scanner.scan();
    while (token != ts.SyntaxKind.EndOfFileToken){
        let currentToken = token;
        let tokenStart = scanner.getStartPos();
        token = scanner.scan();
        let tokenEnd = scanner.getStartPos();
        if (currentToken === ts.SyntaxKind.Identifier){
            // TODO: create a position -> line / offset function.
            tsserver.definition(filePath, 0, tokenStart, (d)=>{
                console.log(d.toString());
            });
        }
        console.log(currentToken, tokenStart, tokenEnd);
    }
    console.log(results);


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
}
