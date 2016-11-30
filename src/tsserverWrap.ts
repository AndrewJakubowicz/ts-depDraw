import * as child_process from "child_process";

/**
 * Wrapper for tsserver.
 * 
 * TODO: make sure tsserver responds sequentually. Otherwise we'll get confused definitions.
 */
export class Tsserver{
    private proc: child_process.ChildProcess;
    private operations: ((err: Error, s: string | Buffer)=>void)[] = [];
    private seq: number = 0;
    constructor(){
        this.proc = child_process.spawn('tsserver');

        /**
         * This has to be able to handle batch responses.
         * Therefore it splits up the response and then process them individually.
         */
        this.proc.stdout.on("data", d => {
            // console.log(`OUT: ${d}`);

            // Split and filter out the stuff that isn't needed.
            let allData = d.toString().split(/\r\n|\n/).filter(v => {
                return !(v === '' || v.slice(0, 14) === 'Content-Length')} );

            // Grab first callback
            let callback = this.operations.shift();
            let chunk = allData.shift();
            
            while (allData.length > 0){
                // console.log(`Checking lengths of operations vs callbacks: (${allData.length} == ${this.operations.length})`);
                callback(null, chunk);
                callback = this.operations.shift();
                chunk = allData.shift();
            }
            callback(null, chunk);
        });

        this.proc.stderr.on("data", d => {
            console.error(`ERR: ${d}`);
            let callback = this.operations.shift();
            callback(new Error(d.toString()), null);
        });

        this.proc.on('close', (err,code) => {
            console.log(`QUIT: ${code}`);
        });
    }
    /**
     * Allows go to definition using tsserver.
     * 
     * If you don't open the file before trying to find definitions in it, this will fail.
     */
    definition(filePath:string, line: number, column: number, callback: (err: Error, response: string )=> void) {
        this.proc.stdin.write(`{"seq":${this.seq},"type":"quickinfo","command":"definition","arguments":{"file":"${filePath}", "line":${line}, "offset": ${column}}}\n`);
        this.operations.push(callback);
        this.seq++;
    }
    open(filePath: string, callback: (err: Error, response: string )=> void){
        this.proc.stdin.write(`{"seq":${this.seq},"type":"request","command":"open","arguments":{"file":"${filePath}"}}\n`);
        this.operations.push(callback);
        this.seq++;
    }
    kill(){
        this.proc.kill();
    }
}
JSON.parse
