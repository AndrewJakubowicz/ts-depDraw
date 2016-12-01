"use strict";
/**
 * Author: Andrew Jakubowicz
 */
var fs = require("fs");
var readline = require("readline");
var path = require("path");
var winston = require("./appLogger");
var ts = require("TypeScript");
var tsserverWrap_1 = require("./tsserverWrap");
/**
 * Reads entire typeScript file.
 */
function scanFile(filePath, callback) {
    scanFileBetween(filePath, null, callback);
}
exports.scanFile = scanFile;
/**
 * Always takes file paths from root of project directory.
 *
 * lineStartAndEnd: [number, number] and is inclusive.
 *
 * @parem {string[][]} locations is an array of tuples in the form [string, ]
 */
function scanFileBetween(filePath, lineStartAndEnd, callback) {
    /**
     * Below code doesn't use root of directory as reference.
     * TODO: make sure this path reflects the root of the directory we are trying to traverse.
     * Answer here: http://stackoverflow.com/a/18721515
     */
    var appDir = path.dirname(global.appRoot);
    filePath = appDir + '/' + filePath;
    winston.log("debug", "function scanFile trying to access " + filePath);
    var tssFilePath = filePath;
    if (!fs.existsSync(filePath)) {
        winston.log("debug", "File doesn't exist: " + filePath);
        callback(new Error("File doesn't exist: " + filePath), null);
        return;
    }
    var results = [];
    var tsserver = new tsserverWrap_1.Tsserver();
    tsserver.open(filePath, function (err, response) {
        // Probably want to check for success here.
        // TODO: add error handling.
        winston.log("verbose", "OPEN " + filePath + ": " + response);
    });
    /**
     * Reading file from:
     * https://coderwall.com/p/ohjerg/read-large-text-files-in-nodejs
     */
    var instream = fs.createReadStream(filePath);
    var rl = readline.createInterface(instream, process.stdout);
    var lineNum = 0;
    var promises = [];
    /**
     * Setting up event to read the file.
     * Todo: Populate a cache to prevent the same file getting read over and over.
     *      - Important due to a single file containing many modules or namespaces.
     */
    rl.on('line', function (line) {
        lineNum++;
        if (!lineStartAndEnd || (lineStartAndEnd[0] <= lineNum && lineStartAndEnd[1] >= lineNum)) {
            var scanner = initScannerState(line);
            var token = scanner.scan();
            var tokenStart = scanner.getTokenPos();
            while (token != ts.SyntaxKind.EndOfFileToken) {
                if (token === ts.SyntaxKind.Identifier) {
                    // Tokens seem to start with whitespace. Adding one allows the definition to be found.
                    promises.push(lookUpDefinition(tssFilePath, tsserver, lineNum, tokenStart + 1));
                }
                token = scanner.scan();
                tokenStart = scanner.getTokenPos();
            }
        }
    });
    /**
     *
     */
    rl.on('close', function () {
        // Process promises after reading file has concluded.
        Promise.all(promises).then(function () {
            /**
             * Arguments are all here in arguments[0], arguments[1].....
             * Thank you: http://stackoverflow.com/a/10004137
             */
            for (var i = 0; i < arguments.length; i++) {
                winston.log('silly', "ARGUMENTS: " + arguments[i]);
                results.push(arguments[i]);
            }
            tsserver.kill();
            winston.log('verbose', "RESULTS: " + results);
            // Results somehow ends up as a type string[][][], with the first index being everything we want.
            // TODO: work out why we get a string[][][]!?
            callback(null, results[0]);
        }, function (err) {
            winston.log("error", "Promise resolve error: '" + err + "'");
        });
    });
    function initScannerState(text) {
        // TODO: scanner matches tsconfig.
        var scanner = ts.createScanner(ts.ScriptTarget.Latest, true);
        scanner.setText(text);
        scanner.setOnError(function (message, length) {
            winston.log('error', "" + message);
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
            tsserver.definition(filePath, lineNum, tokenPos, function (err, res, req) {
                if (err)
                    reject(err);
                else
                    fulfill([req, res]);
            });
        });
    }
}
exports.scanFileBetween = scanFileBetween;
