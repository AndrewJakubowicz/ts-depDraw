import * as stream from 'stream';
import * as util from 'util';
import * as assert from 'assert';
import * as Immutable from 'Immutable';

// Credit given to https://www.sandersdenardi.com/readable-writable-transform-streams-node/
// for the amazing stream writeup that helped make this reality.
export let TransformSplitResponseStream = function() {
    stream.Transform.call(this, {objectMode: false});
}

util.inherits(TransformSplitResponseStream, stream.Transform);


// Stores the contentLength information so writeStream can wait for entire data before writing.
let contentLengths = Immutable.Stack([]);

TransformSplitResponseStream.prototype._transform = function(chunk, encoding, callback) {
    const strChunk: string = chunk.toString();

    const splitChunk = strChunk.split(/\r\n|\n/);

    let contentLength: number;

    for (let stringPiece of splitChunk) {
        if (stringPiece.trim().length === 0) {
            continue;
        }
        if (stringPiece.substr(0, 14) == "Content-Length"){
            contentLength = Number(stringPiece.split(' ').slice(-1)[0]);
            // Accounting for off by 1 error.
            contentLengths = contentLengths.push(contentLength - 1);
        } else {
            this.push(stringPiece);     // Emitting!
        }
    }

    callback(); // We're done with the chunk.
}





// WriteStream pools the response and fires the promise callback when
// a full response is received.
export let WriteStream = function(responseCallbackBacklog: Array<any>) {
    this.store = responseCallbackBacklog;
    stream.Writable.call(this, {objectMode: false});
}

util.inherits(WriteStream, stream.Writable);



// The 'sink' for tsserverWrap.
let chunkBuffer = "";
WriteStream.prototype._write = function (chunk, encoding, callback) {
    // If the contentLength in the stack isn't the same as the chunk, we have a problem.
    
    // When we have a full response put it into the responseCallbackBacklog.
    let responseCallbackBacklog = (this.store as Array<any>);
    chunkBuffer += chunk.toString();
    if (contentLengths.first() === chunkBuffer.length){
        console.log('Buffer complete');
        contentLengths = contentLengths.shift();
        // Call the response with correct chunk.
        (responseCallbackBacklog.shift())(null, chunkBuffer)
        chunkBuffer = "";
        return callback();
    }


    chunkBuffer += chunk.toString();
    try {
        assert(contentLengths.first() < chunkBuffer.length, 'ContentLength MUST always be less than chunkBuffer.length');
    }
    catch (err) {
        chunkBuffer = "";
        (responseCallbackBacklog.shift())(err, null)
    }
    

    callback();
}