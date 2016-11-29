import * as child_process from "child_process";


export class Tsserver{
    private proc: child_process.ChildProcess;
    private operations: ((s: string | Buffer)=>void)[] = [];
    private seq: number = 0;
    constructor(){
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
    definition(filePath:string, line: number, column: number, callback: (response: string )=> void) {
        this.proc.stdin.write(`{"seq":${this.seq},"type":"quickinfo","command":"definition","arguments":{"file":"${filePath}", "line":${line}, "offset": ${column}}}\n`);
        this.operations.push(callback);
        this.seq++;
    }
    open(filePath: string, callback: (response: string )=> void){
        this.proc.stdin.write(`{"seq":${this.seq},"type":"request","command":"open","arguments":{"file":"${filePath}"}}\n`);
        this.operations.push(callback);
        this.seq++;
    }
    kill(){
        this.proc.kill();
    }
}
