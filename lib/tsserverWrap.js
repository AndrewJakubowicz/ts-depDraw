"use strict";
var child_process = require("child_process");
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
            // console.log(`OUT: ${d}`);
            // Split and filter out the stuff that isn't needed.
            var allData = d.toString().split(/\r\n|\n/).filter(function (v) {
                return !(v === '' || v.slice(0, 14) === 'Content-Length');
            });
            // Grab first callback
            var callback = _this.operations.shift();
            var chunk = allData.shift();
            while (allData.length > 0) {
                console.log("Checking lengths of operations vs callbacks: (" + allData.length + " == " + _this.operations.length + ")");
                callback(null, chunk);
                callback = _this.operations.shift();
                chunk = allData.shift();
            }
            callback(null, chunk);
        });
        /**
         * Not actually sure if this will ever call.
         * I think tsserver responds with success: false in the case of error.
         */
        this.proc.stderr.on("data", function (d) {
            console.error("ERR: " + d);
            var callback = _this.operations.shift();
            callback(new Error(d.toString()), null);
        });
        this.proc.on('close', function (err, code) {
            console.log("QUIT: " + code);
        });
    }
    /**
     * Allows goto definition using tsserver.
     * This will store a callback on the FIFO queue.
     * If you don't open the file before trying to find definitions in it, this will fail.
     */
    Tsserver.prototype.definition = function (filePath, line, column, callback) {
        this.proc.stdin.write("{\"seq\":" + this.seq + ",\"type\":\"quickinfo\",\"command\":\"definition\",\"arguments\":{\"file\":\"" + filePath + "\", \"line\":" + line + ", \"offset\": " + column + "}}\n");
        this.operations.push(callback);
        this.seq++;
    };
    Tsserver.prototype.open = function (filePath, callback) {
        this.proc.stdin.write("{\"seq\":" + this.seq + ",\"type\":\"request\",\"command\":\"open\",\"arguments\":{\"file\":\"" + filePath + "\"}}\n");
        this.operations.push(callback);
        this.seq++;
    };
    Tsserver.prototype.kill = function () {
        this.proc.kill();
    };
    return Tsserver;
}());
exports.Tsserver = Tsserver;
