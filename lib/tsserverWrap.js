"use strict";
/**
 * Author: Andrew Jakubowicz
 *
 * This module exposes some of the funcitonality of the tsserver.
 */
var path = require("path");
var readline = require("readline");
var fs = require("fs");
var ts = require("TypeScript");
var child_process = require("child_process");
var winston = require("./appLogger");
// You can access the variables with config.maxDepth
var config = require("../config.json");
/**
 * methods fileScanner accepts
 */
var CommandMethodsFileScan;
(function (CommandMethodsFileScan) {
    CommandMethodsFileScan[CommandMethodsFileScan["Definition"] = 0] = "Definition";
    CommandMethodsFileScan[CommandMethodsFileScan["References"] = 1] = "References";
})(CommandMethodsFileScan || (CommandMethodsFileScan = {}));
/**
 * Wrapper for tsserver.
 *
 * TODO: make sure tsserver responds sequentually. Otherwise we'll get confused definitions.
 *          - TODO: This should be resolved downstream by comparing seq with req_seq.
 */
var Tsserver = (function () {
    /**
     * Spawns tsserver singleton and awaits events.
     */
    function Tsserver() {
        var _this = this;
        this.operations = [];
        this.seq = 0; // tsserver requires everything to have a sequence number.
        /**
         * Worker which scans the file.
         */
        this.scanFileBetweenWorker = function (filePath, lineStartAndEnd, command, callback) {
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
            _this.open(filePath, function (err, response) {
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
                            if (command == CommandMethodsFileScan.Definition) {
                                promises.push(_this.lookUpDefinition(tssFilePath, lineNum, tokenStart + 1, { token: scanner.getTokenText() }));
                            }
                            else if (command == CommandMethodsFileScan.References) {
                                promises.push(_this.lookUpReferences(tssFilePath, lineNum, tokenStart + 1, { token: scanner.getTokenText() }));
                            }
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
                    winston.log('verbose', "RESULTS: " + results);
                    // Results somehow ends up as a type string[][][], with the first index being everything we want.
                    // TODO: work out why we get a string[][][]!?
                    callback(null, results[0]);
                }).catch(function (err) { winston.log("error", "Promise error: " + err); });
            });
        };
        this.proc = child_process.exec('tsserver');
        /**
         * This has to be able to handle batch responses.
         * Therefore it splits up the response and then process them individually.
         */
        this.proc.stdout.on("data", function (d) {
            winston.log('debug', "TSSERVER OUT: \"" + d + "\"");
            // Split and filter out the stuff that isn't needed.
            var allData = d.toString().split(/\r\n|\n/).filter(function (v) {
                return !(v === '' || v.slice(0, 14) === 'Content-Length');
            });
            // Grab first callback and data.
            var _a = _this.operations.shift(), callback = _a[0], command = _a[1], chunk = allData.shift();
            while (allData.length > 0) {
                winston.log("debug", "Tsserver response: Checking lengths of operations vs callbacks: (" + allData.length + " == " + _this.operations.length + ")");
                callback(null, chunk, command);
                _b = _this.operations.shift(), callback = _b[0], command = _b[1];
                chunk = allData.shift();
            }
            callback(null, chunk, command);
            var _b;
        });
        /**
         * Not actually sure if this will ever call.
         * I think tsserver responds with success: false in the case of error.
         */
        this.proc.stderr.on("data", function (d) {
            winston.log("error", "TSSERVER ERR: " + d);
            var _a = _this.operations.shift(), callback = _a[0], command = _a[1];
            callback(new Error(d.toString()), null, command);
        });
        this.proc.on('close', function (err, code) {
            winston.log("debug", "TSSERVER QUIT: " + code);
        });
    }
    /**
     * Allows goto definition using tsserver.
     * This will store a callback on the FIFO queue.
     * If you don't open the file before trying to find definitions in it, this will fail.
     */
    Tsserver.prototype.definition = function (filePath, line, column, callback) {
        var command = "{\"seq\":" + this.seq + ",\"type\":\"request\",\"command\":\"definition\",\"arguments\":{\"file\":\"" + filePath + "\", \"line\":" + line + ", \"offset\": " + column + "}}\n";
        winston.log("data", "SENDING TO TSSERVER: \"" + command + "\"");
        this.proc.stdin.write(command);
        this.operations.push([callback, command]);
        this.seq++;
    };
    /**
     * Returns a response showing what implements something.
     */
    Tsserver.prototype.references = function (filePath, line, column, callback) {
        var command = "{\"seq\":" + this.seq + ",\"type\":\"request\",\"command\":\"references\",\"arguments\":{\"file\":\"" + filePath + "\", \"line\":" + line + ", \"offset\": " + column + "}}\n";
        winston.log("data", "SENDING TO TSSERVER: \"" + command + "\"");
        this.proc.stdin.write(command);
        this.operations.push([callback, command]);
        this.seq++;
    };
    Tsserver.prototype.open = function (filePath, callback) {
        var command = "{\"seq\":" + this.seq + ",\"type\":\"request\",\"command\":\"open\",\"arguments\":{\"file\":\"" + filePath + "\"}}\n";
        winston.log("data", "SENDING TO TSSERVER: \"" + command + "\"");
        this.proc.stdin.write(command);
        this.operations.push([callback, command]);
        this.seq++;
    };
    Tsserver.prototype.kill = function () {
        winston.log("data", "TSSERVER SENDING QUIT REQUEST");
        this.proc.kill();
    };
    /**
     * Reads entire typeScript file.
     */
    Tsserver.prototype.scanFile = function (filePath, callback) {
        this.scanFileBetween(filePath, null, callback);
    };
    /**
     * Reads entire typeScript file using define.
     */
    Tsserver.prototype.scanFileBetween = function (filePath, lineStartAndEnd, callback) {
        this.scanFileBetweenWorker(filePath, lineStartAndEnd, CommandMethodsFileScan.Definition, callback);
    };
    /**
     * Reads entire file using reference.
     */
    Tsserver.prototype.scanFileReference = function (filePath, callback) {
        this.scanFileBetweenReference(filePath, null, callback);
    };
    /**
     * Scans file and collects all the references between two line numbers. (inclusive)
     */
    Tsserver.prototype.scanFileBetweenReference = function (filePath, lineStartAndEnd, callback) {
        this.scanFileBetweenWorker(filePath, lineStartAndEnd, CommandMethodsFileScan.References, callback);
    };
    /**
     * Uses the filepath, sourceFile and position to look up a definition.
     * Returns a promise.
     */
    Tsserver.prototype.lookUpDefinition = function (filePath, lineNum, tokenPos, reqBody) {
        var _this = this;
        return new Promise(function (fulfill, reject) {
            _this.definition(filePath, lineNum, tokenPos, function (err, res, req) {
                if (err)
                    reject(err);
                else
                    fulfill([mergeRequestWithBody(req, reqBody), res]);
            });
        });
    };
    ;
    /**
     * Uses the filepath, sourceFile and position to look up a definition.
     * Returns a promise.
     */
    Tsserver.prototype.lookUpReferences = function (filePath, lineNum, tokenPos, reqBody) {
        var _this = this;
        return new Promise(function (fulfill, reject) {
            _this.references(filePath, lineNum, tokenPos, function (err, res, req) {
                if (err)
                    reject(err);
                else
                    fulfill([mergeRequestWithBody(req, reqBody), res]);
            });
        });
    };
    ;
    return Tsserver;
}());
exports.Tsserver = Tsserver;
/**
 * This is the point at which we can add as much as we want to the request.
 */
function mergeRequestWithBody(req, body) {
    var newReq = JSON.parse(req);
    newReq.body = body;
    return JSON.stringify(newReq);
}
function initScannerState(text) {
    // TODO: scanner matches tsconfig.
    var scanner = ts.createScanner(ts.ScriptTarget.Latest, true);
    scanner.setText(text);
    scanner.setOnError(function (message, length) {
        winston.error("" + message);
    });
    // TODO: match with users tsconfig.json
    scanner.setScriptTarget(ts.ScriptTarget.ES5);
    // TODO: match variant with tsconfig.json
    scanner.setLanguageVariant(ts.LanguageVariant.Standard);
    return scanner;
}
