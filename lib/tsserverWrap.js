"use strict";
var child_process = require("child_process");
var winston = require("winston");
// Sets logging based on environmental variable.
// TODO: replace static log level with changable one.
// winston.level = process.env.LOG_LEVEL;
winston.level = "verbose";
/**
 * Wrapper for tsserver.
 *
 * TODO: make sure tsserver responds sequentually. Otherwise we'll get confused definitions.
 */
var Tsserver = (function () {
    /**
     * Spawns tsserver singleton and awaits events.
     */
    function Tsserver() {
        var _this = this;
        this.operations = [];
        this.seq = 0; // tsserver requires everything to have a sequence number.
        this.proc = child_process.spawn('tsserver');
        /**
         * This has to be able to handle batch responses.
         * Therefore it splits up the response and then process them individually.
         */
        this.proc.stdout.on("data", function (d) {
            winston.log('verbose', "TSSERVER OUT: \"" + d + "\"");
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
            winston.log("verbose", "TSSERVER QUIT: " + code);
        });
    }
    /**
     * Allows goto definition using tsserver.
     * This will store a callback on the FIFO queue.
     * If you don't open the file before trying to find definitions in it, this will fail.
     */
    Tsserver.prototype.definition = function (filePath, line, column, callback) {
        var command = "{\"seq\":" + this.seq + ",\"type\":\"quickinfo\",\"command\":\"definition\",\"arguments\":{\"file\":\"" + filePath + "\", \"line\":" + line + ", \"offset\": " + column + "}}\n";
        winston.log("debug", "SENDING TO TSSERVER: \"" + command + "\"");
        this.proc.stdin.write(command);
        this.operations.push([callback, command]);
        this.seq++;
    };
    Tsserver.prototype.open = function (filePath, callback) {
        var command = "{\"seq\":" + this.seq + ",\"type\":\"request\",\"command\":\"open\",\"arguments\":{\"file\":\"" + filePath + "\"}}\n";
        winston.log("debug", "SENDING TO TSSERVER: \"" + command + "\"");
        this.proc.stdin.write(command);
        this.operations.push([callback, command]);
        this.seq++;
    };
    Tsserver.prototype.kill = function () {
        winston.log("debug", "TSSERVER SENDING QUIT REQUEST");
        this.proc.kill();
    };
    return Tsserver;
}());
exports.Tsserver = Tsserver;
