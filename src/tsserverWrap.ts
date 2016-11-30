import * as child_process from "child_process";
import * as winston from "winston";

// Sets logging based on environmental variable.
// TODO: replace static log level with changable one.
// winston.level = process.env.LOG_LEVEL;
winston.level = "verbose";

/**
 * Wrapper for tsserver.
 * 
 * TODO: make sure tsserver responds sequentually. Otherwise we'll get confused definitions.
 */
export class Tsserver{
    private proc: child_process.ChildProcess;
    private operations: ((err: Error, s: string | Buffer)=>void)[] = [];
    private seq: number = 0;                                                // tsserver requires everything to have a sequence number.

    /**
     * Spawns tsserver singleton and awaits events.
     */
    constructor(){
        
        this.proc = child_process.spawn('tsserver');


        /**
         * This has to be able to handle batch responses.
         * Therefore it splits up the response and then process them individually.
         */
        this.proc.stdout.on("data", d => {
            winston.log('verbose', `TSSERVER OUT: "${d}"`);

            // Split and filter out the stuff that isn't needed.
            let allData = d.toString().split(/\r\n|\n/).filter(v => {
                return !(v === '' || v.slice(0, 14) === 'Content-Length')} );

            // Grab first callback and data.
            let callback = this.operations.shift(),
                chunk = allData.shift();
            
            while (allData.length > 0){
                winston.log("debug", `Tsserver response: Checking lengths of operations vs callbacks: (${allData.length} == ${this.operations.length})`);
                callback(null, chunk);
                callback = this.operations.shift();
                chunk = allData.shift();
            }
            callback(null, chunk);
        });


        /**
         * Not actually sure if this will ever call.
         * I think tsserver responds with success: false in the case of error.
         */
        this.proc.stderr.on("data", d => {
            winston.log("error", `TSSERVER ERR: ${d}`);
            let callback = this.operations.shift();
            callback(new Error(d.toString()), null);
        });


        this.proc.on('close', (err,code) => {
            winston.log("verbose", `TSSERVER QUIT: ${code}`);
        });
    }



    /**
     * Allows goto definition using tsserver.
     * This will store a callback on the FIFO queue.
     * If you don't open the file before trying to find definitions in it, this will fail.
     */
    definition(filePath:string, line: number, column: number, callback: (err: Error, response: string )=> void) {
        let command = `{"seq":${this.seq},"type":"quickinfo","command":"definition","arguments":{"file":"${filePath}", "line":${line}, "offset": ${column}}}\n`;
        winston.log("debug", `SENDING TO TSSERVER: "${command}"`);
        this.proc.stdin.write(command);
        this.operations.push(callback);
        this.seq++;
    }
    open(filePath: string, callback: (err: Error, response: string )=> void){
        let command = `{"seq":${this.seq},"type":"request","command":"open","arguments":{"file":"${filePath}"}}\n`;
        winston.log("debug", `SENDING TO TSSERVER: "${command}"`);
        this.proc.stdin.write(command);
        this.operations.push(callback);
        this.seq++;
    }
    kill(){
        winston.log("debug", `TSSERVER SENDING QUIT REQUEST`);
        this.proc.kill();
    }
}
