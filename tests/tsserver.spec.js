var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;
var winston = require("../lib/appLogger");

var tss = require("../lib/tsserverWrap");


/**
 * Mocking the global dependencies of the node app.
 * TODO: make sure this path reflects the root of the directory we are trying to traverse.
 * ASSUMPTION: That it's this project that is being traversed.'
 * Answer here: http://stackoverflow.com/a/18721515
 */
var path = require("path");
global.appRoot = path.resolve(__dirname);


describe('Basic uses of a tsserver:', function() {
    this.timeout(10000);
    var s = new tss.Tsserver();

    // Remember to clean up the server once you're finished.
    after(function(){
        s.kill();
    });
    
    it("Open a file on the tsserver", function(done) {
        s.open("tests/examples/ex1.ts", function(err, d) {
            if (err){
                throw new Error("Basic use of a tsserver failed:", err);
            }
            var captured = d.toString();
            expect(captured).to.eq('{"seq":0,"type":"event","event":"configFileDiag","body":{"configFile":"tsconfig.json","diagnostics":[]}}');
            done()
        });
    });

    it('Simple definition matches', function(done){
        var captured = "";
        s.open("tests/examples/ex1.ts", function(err, d) {
            captured += d.toString();
        });
        s.definition('tests/examples/ex1.ts', 1, 14, function(err, d){
            console.log("Reading definition", d);
            captured += d.toString();

            expect(captured).to.eql('{"seq":0,"type":"event","event":"configFileDiag","body":{"configFile":"tsconfig.json","diagnostics":[]}}{"seq":0,"type":"response","command":"definition","request_seq":2,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":2111,"offset":1},"end":{"line":2610,"offset":2}}]}');
            done()
        });
    });

    it("Simple references method", function(done){
        var captured = "";
        s.open('tests/examples/ex5.ts', function(err, d, req) {
            if (err) {
                throw new Error("Reference method failed:", err);
            }
            winston.log("error", req);
        });
        s.references('tests/examples/ex5.ts', 7, 17, function(err, d, req){
            captured = d.toString();
            expect(captured).to.eql('{"seq":0,"type":"response","command":"references","request_seq":4,"success":true,"body":{"refs":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex3.ts","start":{"line":7,"offset":5},"lineText":"ex5.betterConsoleLog(adderTest(1, 2));","end":{"line":7,"offset":21},"isWriteAccess":false,"isDefinition":false},{"file":"tests/examples/ex5.ts","start":{"line":7,"offset":17},"lineText":"export function betterConsoleLog(a){","end":{"line":7,"offset":33},"isWriteAccess":true,"isDefinition":true}],"symbolName":"betterConsoleLog","symbolStartOffset":17,"symbolDisplayString":"function betterConsoleLog(a: any): void"}}');
            done();
        });
        
    })
});

describe("Single File Scan", function(){
    var response;
    before(function(done){
        this.timeout(10000);
        var tsserver = new tss.Tsserver();
        tsserver.scanFile("tests/examples/ex1.ts", (err, r)=>{
            if (err) {
                winston.log('error', err);
            }
            winston.log('data', r[0]);
            // We want just the responses from the tuples.
            response = r.map((currentRequestResponse) => { 
                return currentRequestResponse[1]
                })
                .toString();
            
            done();
        });
    });
    it("Small file scan", function(){
        expect(response).to.eql([ '{"seq":0,"type":"response","command":"definition","request_seq":1,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":2111,"offset":1},"end":{"line":2610,"offset":2}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":2,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":1,"offset":8},"end":{"line":1,"offset":15}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":3,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":2457,"offset":5},"end":{"line":2457,"offset":64}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":4,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/typescript/lib/lib.d.ts","start":{"line":18613,"offset":13},"end":{"line":18613,"offset":29}},{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":50,"offset":13},"end":{"line":50,"offset":29}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":5,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":19,"offset":5},"end":{"line":19,"offset":56}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":6,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":1},"end":{"line":9,"offset":2}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":7,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":1},"end":{"line":9,"offset":2}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":8,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":16},"end":{"line":7,"offset":17}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":9,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":18},"end":{"line":7,"offset":19}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":10,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":16},"end":{"line":7,"offset":17}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":11,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":18},"end":{"line":7,"offset":19}}]}' ].toString());
    });
});


describe("Partial File Scan", function(){
    before(function(done){
        this.timeout(10000);
        var tsserver = new tss.Tsserver();
        tsserver.scanFileBetween("tests/examples/ex1.ts", [1,9], (err, r)=>{
            if (err) {
                winston.log('error', err);
            }
            winston.log('data', r[0]);
            response = r.map((currentRequestResponse) => { 
                return currentRequestResponse[1]
                })
                .toString();


            tsserver.scanFileBetween("tests/examples/ex1.ts", [1,1], (err, r)=>{
                if (err) {
                    winston.log('error', err);
                }
                winston.log('data',`response2: '${r[0]}'`);
                response2 = r.map((currentRequestResponse) => { 
                    return currentRequestResponse[1]
                    })
                    .toString();
                done();
            });
        });
    });
    it("Partial file scan", function(){
        expect(response).to.eql([ '{"seq":0,"type":"response","command":"definition","request_seq":1,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":2111,"offset":1},"end":{"line":2610,"offset":2}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":2,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":1,"offset":8},"end":{"line":1,"offset":15}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":3,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":2457,"offset":5},"end":{"line":2457,"offset":64}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":4,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/typescript/lib/lib.d.ts","start":{"line":18613,"offset":13},"end":{"line":18613,"offset":29}},{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":50,"offset":13},"end":{"line":50,"offset":29}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":5,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":19,"offset":5},"end":{"line":19,"offset":56}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":6,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":1},"end":{"line":9,"offset":2}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":7,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":1},"end":{"line":9,"offset":2}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":8,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":16},"end":{"line":7,"offset":17}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":9,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":18},"end":{"line":7,"offset":19}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":10,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":16},"end":{"line":7,"offset":17}}]}',
    '{"seq":0,"type":"response","command":"definition","request_seq":11,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":18},"end":{"line":7,"offset":19}}]}' ].toString());
    });

    it("Single line scan", function(){
        expect(response2).to.eql([ '{"seq":0,"type":"response","command":"definition","request_seq":13,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":2111,"offset":1},"end":{"line":2610,"offset":2}}]}' ].toString());
    })
});
