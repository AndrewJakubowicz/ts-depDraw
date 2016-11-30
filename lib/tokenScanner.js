"use strict";
var fs = require("fs");
var readline = require("readline");
var path = require("path");
var ts = require("TypeScript");
var tsserverWrap_1 = require("./tsserverWrap");
function scanFile(filePath, callback) {
    scanFileBetween(filePath, null, callback);
}
exports.scanFile = scanFile;
/**
 * Always takes file paths from root of project directory.
 */
function scanFileBetween(filePath, lineStartAndEnd, callback) {
    /**
     * Below code doesn't use root of directory as reference.
     * TODO: make sure this path reflects the root of the directory we are trying to traverse.
     * Answer here: http://stackoverflow.com/a/18721515
     */
    var appDir = path.dirname(global.appRoot);
    filePath = appDir + '/' + filePath;
    var tssFilePath = filePath;
    if (!fs.existsSync(filePath)) {
        callback(new Error("File doesn't exist: " + filePath), null);
        return;
    }
    var results = [];
    var tsserver = new tsserverWrap_1.Tsserver();
    tsserver.open(filePath, function (err, response) {
        // Probably want to check for success here.
        // TODO: add error handling.
        console.log("OPEN " + filePath + ": " + response);
    });
    /**
     * Reading file from:
     * https://coderwall.com/p/ohjerg/read-large-text-files-in-nodejs
     */
    var instream = fs.createReadStream(filePath);
    var rl = readline.createInterface(instream, process.stdout);
    var lineNum = 0;
    var promises = [];
    rl.on('line', function (line) {
        lineNum++;
        if (!lineStartAndEnd || (lineStartAndEnd[0] < lineNum && lineStartAndEnd[1] > lineNum)) {
            var scanner = initScannerState(line);
            var token = scanner.scan();
            var tokenStart = scanner.getTokenPos();
            while (token != ts.SyntaxKind.EndOfFileToken) {
                if (token === ts.SyntaxKind.Identifier) {
                    // console.log(`${scanner.getTokenText()} at (${lineNum}, ${tokenStart + 1})`);
                    promises.push(lookUpDefinition(tssFilePath, tsserver, lineNum, tokenStart + 1));
                }
                token = scanner.scan();
                tokenStart = scanner.getTokenPos();
            }
        }
    });
    rl.on('close', function () {
        Promise.all(promises).then(function () {
            // Arguments are all here in arguments[0], arguments[1].....
            // Thank you: http://stackoverflow.com/a/10004137
            for (var i = 0; i < arguments.length; i++) {
                results.push(arguments[i]);
            }
            callback(null, results);
        }, function (err) {
            console.error(err);
        });
    });
    function initScannerState(text) {
        // TODO: scanner matches tsconfig.
        var scanner = ts.createScanner(ts.ScriptTarget.Latest, true);
        scanner.setText(text);
        scanner.setOnError(function (message, length) {
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
    function lookUpDefinition(filePath, tsserver, lineNum, tokenPos) {
        return new Promise(function (fulfill, reject) {
            tsserver.definition(filePath, lineNum, tokenPos, function (err, res) {
                if (err)
                    reject(err);
                else
                    fulfill(res);
            });
        });
    }
}
exports.scanFileBetween = scanFileBetween;
