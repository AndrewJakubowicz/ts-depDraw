"use strict";
const child_process = require("child_process");
class Tsserver {
    constructor() {
        this.operations = [];
        this.seq = 0;
        this.proc = child_process.spawn('tsserver');
        this.proc.stdout.on("data", d => {
            // console.log(`OUT: ${d}`);
            let callback = this.operations.shift();
            callback(d);
        });
        this.proc.stderr.on("data", d => {
            console.error(`ERR: ${d}`);
            this.operations.shift();
        });
        this.proc.on('close', code => {
            console.log(`QUIT: ${code}`);
        });
    }
    definition(filePath, line, column, callback) {
        this.proc.stdin.write(`{"seq":${this.seq},"type":"quickinfo","command":"definition","arguments":{"file":"${filePath}", "line":${line}, "offset": ${column}}}\n`);
        this.operations.push(callback);
        this.seq++;
    }
    open(filePath, callback) {
        this.proc.stdin.write(`{"seq":${this.seq},"type":"request","command":"open","arguments":{"file":"${filePath}"}}\n`);
        this.operations.push(callback);
        this.seq++;
    }
    kill() {
        this.proc.kill();
    }
}
exports.Tsserver = Tsserver;
