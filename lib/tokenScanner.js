"use strict";
var fs = require("fs");
var ts = require("TypeScript");
var tsserverWrap_1 = require("./tsserverWrap");
/**
 * Always takes file paths from root of project directory.
 */
function scanFile(filePath, callback) {
    /**
     * Below code doesn't use root of directory as reference.
     */
    // if (!fs.exists(filePath)){
    //     console.error("File doesn't exist");
    //     return;
    // }
    // TODO: Fix assumption that file exists.
    var text = (fs.readFileSync(filePath)).toString();
    console.log(text);
    // TODO: match target with users tsconfig.json
    var scanner = ts.createScanner(ts.ScriptTarget.Latest, true);
    initScannerState(text);
    // TODO: match config with tsconfig
    // Creates file source interface to use with line/offset function below.
    var fileSourceFile = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest);
    var results = [];
    var tsserver = new tsserverWrap_1.Tsserver();
    tsserver.open(filePath, function (err, response) {
        // Probably want to check for success here.
        // TODO: add error handling.
        console.log("OPEN " + filePath + ": " + response);
    });
    // Now we can scan all the tokens
    var token = scanner.scan();
    var promises = [];
    while (token != ts.SyntaxKind.EndOfFileToken) {
        var currentToken = token;
        var tokenStart = scanner.getStartPos();
        token = scanner.scan();
        var tokenEnd = scanner.getStartPos();
        if (currentToken === ts.SyntaxKind.Identifier) {
            console.log(text.slice(tokenStart, tokenEnd));
            promises.push(lookUpDefinition(filePath, fileSourceFile, tsserver, tokenStart));
        }
    }
    // TODO: This has to wait for the promises to resolve.
    Promise.all(promises).then(function () {
        // Arguments are all here in arguments[0], arguments[1].....
        // Thank you: http://stackoverflow.com/a/10004137
        for (var i = 0; i < arguments.length; i++) {
            results += arguments[i];
        }
        callback(null, results);
    }, function (err) {
        console.error(err);
    });
    function initScannerState(text) {
        scanner.setText(text);
        scanner.setOnError(function (message, length) {
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
    function lookUpDefinition(filePath, fileSource, tsserver, tokenPos) {
        return new Promise(function (fulfill, reject) {
            // Functions source located: https://github.com/Microsoft/TypeScript/blob/master/src/compiler/scanner.ts#L362
            var _a = ts.getLineAndCharacterOfPosition(fileSourceFile, tokenPos), line = _a.line, character = _a.character;
            console.log(line, character);
            tsserver.definition(filePath, line, character, function (err, res) {
                if (err)
                    reject(err);
                else
                    fulfill(res);
            });
        });
    }
}
exports.scanFile = scanFile;
