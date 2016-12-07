var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;
var winston = require("../appLogger");

var tss = require("../tsserverWrap");

var fs = require('fs');

// I am monkey patching this for tests. (oh god :P)
// This will prevent the use of mocha's location and mock project directory.
require.main.filename = `/Users/Spyr1014/Projects/TypeScript/ts-depDraw/lib/main.js`;


describe('Basic uses of a tsserver:', function () {
    this.timeout(10000);
    var s = new tss.Tsserver();

    // Remember to clean up the server once you're finished.
    after(function () {
        s.kill();
    });

    it("Open a file on the tsserver", function (done) {
        s.open("tests/examples/ex1.ts", function (err, d) {
            if (err) {
                throw new Error("Basic use of a tsserver failed:", err);
            }
            var captured = d.toString();
            expect(captured).to.eq('{"seq":0,"type":"event","event":"configFileDiag","body":{"triggerFile":"tests/examples/ex1.ts","configFile":"tsconfig.json","diagnostics":[]}}');
            done()
        });
    });

    it('Simple definition matches', function (done) {
        var captured = "";
        s.open("tests/examples/ex1.ts", function (err, d) {
            captured += d.toString();
        });
        s.definition('tests/examples/ex1.ts', 1, 14, function (err, d) {
            console.log("Reading definition", d);
            captured += d.toString();

            expect(captured).to.eql('{"seq":0,"type":"event","event":"configFileDiag","body":{"triggerFile":"tests/examples/ex1.ts","configFile":"tsconfig.json","diagnostics":[]}}{"seq":0,"type":"response","command":"definition","request_seq":2,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":2111,"offset":1},"end":{"line":2610,"offset":2}}]}');
            done()
        });
    });

    it("Simple references method", function (done) {
        var captured = "";
        s.open('tests/examples/ex5.ts', function (err, d, req) {
            if (err) {
                throw new Error("Reference method failed:", err);
            }
        });
        s.references('tests/examples/ex5.ts', 7, 17, function (err, d, req) {
            captured = d.toString();
            expect(captured).to.eql('{"seq":0,"type":"response","command":"references","request_seq":4,"success":true,"body":{"refs":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex3.ts","start":{"line":7,"offset":5},"lineText":"ex5.betterConsoleLog(adderTest(1, 2));","end":{"line":7,"offset":21},"isWriteAccess":false,"isDefinition":false},{"file":"tests/examples/ex5.ts","start":{"line":7,"offset":17},"lineText":"export function betterConsoleLog(a){","end":{"line":7,"offset":33},"isWriteAccess":true,"isDefinition":true}],"symbolName":"betterConsoleLog","symbolStartOffset":17,"symbolDisplayString":"function betterConsoleLog(a: any): void"}}');
            done();
        });
    });

    //     it("Full file references method", function(done){
    //         var captured = "";
    //         s.scanFileReference('tests/examples/ex5.ts', function(err, res){
    //             captured = res.toString();
    //             expect(captured).to.eql([ [ '{"seq":6,"type":"request","command":"references","arguments":{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex5.ts","line":1,"offset":13},"body":{"token":"ex4"}}',
    //     '{"seq":0,"type":"response","command":"references","request_seq":6,"success":true,"body":{"refs":[{"file":"tests/examples/ex5.ts","start":{"line":1,"offset":13},"lineText":"import * as ex4 from \\"./ex4\\";","end":{"line":1,"offset":16},"isWriteAccess":true,"isDefinition":true},{"file":"tests/examples/ex5.ts","start":{"line":3,"offset":1},"lineText":"ex4.betterAdder(2, 3);","end":{"line":3,"offset":4},"isWriteAccess":false,"isDefinition":false},{"file":"tests/examples/ex5.ts","start":{"line":5,"offset":1},"lineText":"ex4.betterConsoleLog(3);","end":{"line":5,"offset":4},"isWriteAccess":false,"isDefinition":false}],"symbolName":"ex4","symbolStartOffset":13,"symbolDisplayString":"import ex4"}}' ],
    //   [ '{"seq":7,"type":"request","command":"references","arguments":{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex5.ts","line":3,"offset":1},"body":{"token":"ex4"}}',
    //     '{"seq":0,"type":"response","command":"references","request_seq":7,"success":true,"body":{"refs":[{"file":"tests/examples/ex5.ts","start":{"line":1,"offset":13},"lineText":"import * as ex4 from \\"./ex4\\";","end":{"line":1,"offset":16},"isWriteAccess":true,"isDefinition":true},{"file":"tests/examples/ex5.ts","start":{"line":3,"offset":1},"lineText":"ex4.betterAdder(2, 3);","end":{"line":3,"offset":4},"isWriteAccess":false,"isDefinition":false},{"file":"tests/examples/ex5.ts","start":{"line":5,"offset":1},"lineText":"ex4.betterConsoleLog(3);","end":{"line":5,"offset":4},"isWriteAccess":false,"isDefinition":false}],"symbolName":"ex4","symbolStartOffset":1,"symbolDisplayString":"import ex4"}}' ],
    //   [ '{"seq":8,"type":"request","command":"references","arguments":{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex5.ts","line":3,"offset":5},"body":{"token":"betterAdder"}}',
    //     '{"seq":0,"type":"response","command":"references","request_seq":8,"success":true,"body":{"refs":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex4.ts","start":{"line":4,"offset":17},"lineText":"export function betterAdder(c, d){","end":{"line":4,"offset":28},"isWriteAccess":true,"isDefinition":true},{"file":"tests/examples/ex5.ts","start":{"line":3,"offset":5},"lineText":"ex4.betterAdder(2, 3);","end":{"line":3,"offset":16},"isWriteAccess":false,"isDefinition":false}],"symbolName":"betterAdder","symbolStartOffset":5,"symbolDisplayString":"function betterAdder(c: any, d: any): any"}}' ],
    //   [ '{"seq":9,"type":"request","command":"references","arguments":{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex5.ts","line":5,"offset":1},"body":{"token":"ex4"}}',
    //     '{"seq":0,"type":"response","command":"references","request_seq":9,"success":true,"body":{"refs":[{"file":"tests/examples/ex5.ts","start":{"line":1,"offset":13},"lineText":"import * as ex4 from \\"./ex4\\";","end":{"line":1,"offset":16},"isWriteAccess":true,"isDefinition":true},{"file":"tests/examples/ex5.ts","start":{"line":3,"offset":1},"lineText":"ex4.betterAdder(2, 3);","end":{"line":3,"offset":4},"isWriteAccess":false,"isDefinition":false},{"file":"tests/examples/ex5.ts","start":{"line":5,"offset":1},"lineText":"ex4.betterConsoleLog(3);","end":{"line":5,"offset":4},"isWriteAccess":false,"isDefinition":false}],"symbolName":"ex4","symbolStartOffset":1,"symbolDisplayString":"import ex4"}}' ],
    //   [ '{"seq":10,"type":"request","command":"references","arguments":{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex5.ts","line":5,"offset":5},"body":{"token":"betterConsoleLog"}}',
    //     '{"seq":0,"type":"response","command":"references","request_seq":10,"success":true,"body":{"refs":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex4.ts","start":{"line":9,"offset":17},"lineText":"export function betterConsoleLog(a){","end":{"line":9,"offset":33},"isWriteAccess":true,"isDefinition":true},{"file":"tests/examples/ex5.ts","start":{"line":5,"offset":5},"lineText":"ex4.betterConsoleLog(3);","end":{"line":5,"offset":21},"isWriteAccess":false,"isDefinition":false}],"symbolName":"betterConsoleLog","symbolStartOffset":5,"symbolDisplayString":"function betterConsoleLog(a: any): void"}}' ],
    //   [ '{"seq":11,"type":"request","command":"references","arguments":{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex5.ts","line":7,"offset":17},"body":{"token":"betterConsoleLog"}}',
    //     '{"seq":0,"type":"response","command":"references","request_seq":11,"success":true,"body":{"refs":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex3.ts","start":{"line":7,"offset":5},"lineText":"ex5.betterConsoleLog(adderTest(1, 2));","end":{"line":7,"offset":21},"isWriteAccess":false,"isDefinition":false},{"file":"tests/examples/ex5.ts","start":{"line":7,"offset":17},"lineText":"export function betterConsoleLog(a){","end":{"line":7,"offset":33},"isWriteAccess":true,"isDefinition":true}],"symbolName":"betterConsoleLog","symbolStartOffset":17,"symbolDisplayString":"function betterConsoleLog(a: any): void"}}' ],
    //   [ '{"seq":12,"type":"request","command":"references","arguments":{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex5.ts","line":7,"offset":34},"body":{"token":"a"}}',
    //     '{"seq":0,"type":"response","command":"references","request_seq":12,"success":true,"body":{"refs":[{"file":"tests/examples/ex5.ts","start":{"line":7,"offset":34},"lineText":"export function betterConsoleLog(a){","end":{"line":7,"offset":35},"isWriteAccess":true,"isDefinition":true},{"file":"tests/examples/ex5.ts","start":{"line":8,"offset":17},"lineText":"    console.log(a);","end":{"line":8,"offset":18},"isWriteAccess":false,"isDefinition":false}],"symbolName":"a","symbolStartOffset":34,"symbolDisplayString":"(parameter) a: any"}}' ],
    //   [ '{"seq":13,"type":"request","command":"references","arguments":{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex5.ts","line":8,"offset":5},"body":{"token":"console"}}',
    //     '{"seq":0,"type":"response","command":"references","request_seq":13,"success":true,"body":{"refs":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":50,"offset":13},"lineText":"declare var console: Console;","end":{"line":50,"offset":20},"isWriteAccess":true,"isDefinition":true},{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":452,"offset":25},"lineText":"        console: typeof console;","end":{"line":452,"offset":32},"isWriteAccess":false,"isDefinition":false},{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":3966,"offset":14},"lineText":"    export = console;","end":{"line":3966,"offset":21},"isWriteAccess":false,"isDefinition":false},{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/typescript/lib/lib.d.ts","start":{"line":18638,"offset":13},"lineText":"declare var console: Console;","end":{"line":18638,"offset":20},"isWriteAccess":true,"isDefinition":true},{"file":"tests/examples/ex5.ts","start":{"line":8,"offset":5},"lineText":"    console.log(a);","end":{"line":8,"offset":12},"isWriteAccess":false,"isDefinition":false}],"symbolName":"console","symbolStartOffset":5,"symbolDisplayString":"var console: Console"}}' ],
    //   [ '{"seq":14,"type":"request","command":"references","arguments":{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex5.ts","line":8,"offset":13},"body":{"token":"log"}}',
    //     '{"seq":0,"type":"response","command":"references","request_seq":14,"success":true,"body":{"refs":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":19,"offset":5},"lineText":"    log(message?: any, ...optionalParams: any[]): void;","end":{"line":19,"offset":8},"isWriteAccess":true,"isDefinition":true},{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/typescript/lib/lib.d.ts","start":{"line":6093,"offset":5},"lineText":"    log(message?: any, ...optionalParams: any[]): void;","end":{"line":6093,"offset":8},"isWriteAccess":true,"isDefinition":true},{"file":"tests/examples/ex5.ts","start":{"line":8,"offset":13},"lineText":"    console.log(a);","end":{"line":8,"offset":16},"isWriteAccess":false,"isDefinition":false}],"symbolName":"log","symbolStartOffset":13,"symbolDisplayString":"(method) Console.log(message?: any, ...optionalParams: any[]): void (+1 overload)"}}' ],
    //   [ '{"seq":15,"type":"request","command":"references","arguments":{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex5.ts","line":8,"offset":17},"body":{"token":"a"}}',
    //     '{"seq":0,"type":"response","command":"references","request_seq":15,"success":true,"body":{"refs":[{"file":"tests/examples/ex5.ts","start":{"line":7,"offset":34},"lineText":"export function betterConsoleLog(a){","end":{"line":7,"offset":35},"isWriteAccess":true,"isDefinition":true},{"file":"tests/examples/ex5.ts","start":{"line":8,"offset":17},"lineText":"    console.log(a);","end":{"line":8,"offset":18},"isWriteAccess":false,"isDefinition":false}],"symbolName":"a","symbolStartOffset":17,"symbolDisplayString":"(parameter) a: any"}}' ] ].toString());
    //             done()
    //         });
    //     });

    it('Testing if define will give function scope of betterConsoleLog', function (done) {
        s.definition('tests/examples/ex5.ts', 7, 17, function (err, res, req) {
            expect(res.toString()).to.eql(JSON.stringify({ "seq": 0, "type": "response", "command": "definition", "request_seq": 5, "success": true, "body": [{ "file": "tests/examples/ex5.ts", "start": { "line": 7, "offset": 1 }, "end": { "line": 9, "offset": 2 } }] }))
            done()
        });
    });
});

describe("Single File Scan:", function () {
    var response;
    before(function (done) {
        this.timeout(10000);
        var tsserver = new tss.Tsserver();
        tsserver.scanFile("tests/examples/ex1.ts", (err, r) => {
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
    it("Small file scan", function () {
        
        expect(response).to.eql(`{"seq":0,"type":"response","command":"definition","request_seq":1,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":2111,"offset":1},"end":{"line":2610,"offset":2}}]},{"seq":0,"type":"response","command":"definition","request_seq":2,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":1,"offset":8},"end":{"line":1,"offset":15}}]},{"seq":0,"type":"response","command":"definition","request_seq":3,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":2457,"offset":5},"end":{"line":2457,"offset":64}}]},{"seq":0,"type":"response","command":"definition","request_seq":4,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/typescript/lib/lib.d.ts","start":{"line":18638,"offset":13},"end":{"line":18638,"offset":29}},{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":50,"offset":13},"end":{"line":50,"offset":29}}]},{"seq":0,"type":"response","command":"definition","request_seq":5,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":19,"offset":5},"end":{"line":19,"offset":56}}]},{"seq":0,"type":"response","command":"definition","request_seq":6,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":1},"end":{"line":9,"offset":2}}]},{"seq":0,"type":"response","command":"definition","request_seq":7,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":1},"end":{"line":9,"offset":2}}]},{"seq":0,"type":"response","command":"definition","request_seq":8,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":16},"end":{"line":7,"offset":17}}]},{"seq":0,"type":"response","command":"definition","request_seq":9,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":18},"end":{"line":7,"offset":19}}]},{"seq":0,"type":"response","command":"definition","request_seq":10,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":16},"end":{"line":7,"offset":17}}]},{"seq":0,"type":"response","command":"definition","request_seq":11,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":18},"end":{"line":7,"offset":19}}]}`);
    });
});


describe("Partial File Scan", function () {
    before(function (done) {
        this.timeout(10000);
        var tsserver = new tss.Tsserver();
        tsserver.scanFileBetween("tests/examples/ex1.ts", [1, 9], (err, r) => {
            if (err) {
                winston.log('error', err);
            }
            winston.log('data', r[0]);
            response = r.map((currentRequestResponse) => {
                return currentRequestResponse[1]
            })
                .toString();


            tsserver.scanFileBetween("tests/examples/ex1.ts", [1, 1], (err, r) => {
                if (err) {
                    winston.log('error', err);
                }
                winston.log('data', `response2: '${r[0]}'`);
                response2 = r.map((currentRequestResponse) => {
                    return currentRequestResponse[1]
                })
                    .toString();
                done();
            });
        });
    });
    it("Partial file scan", function () {
        expect(response).to.eql(`{"seq":0,"type":"response","command":"definition","request_seq":1,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":2111,"offset":1},"end":{"line":2610,"offset":2}}]},{"seq":0,"type":"response","command":"definition","request_seq":2,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":1,"offset":8},"end":{"line":1,"offset":15}}]},{"seq":0,"type":"response","command":"definition","request_seq":3,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":2457,"offset":5},"end":{"line":2457,"offset":64}}]},{"seq":0,"type":"response","command":"definition","request_seq":4,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/typescript/lib/lib.d.ts","start":{"line":18638,"offset":13},"end":{"line":18638,"offset":29}},{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":50,"offset":13},"end":{"line":50,"offset":29}}]},{"seq":0,"type":"response","command":"definition","request_seq":5,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":19,"offset":5},"end":{"line":19,"offset":56}}]},{"seq":0,"type":"response","command":"definition","request_seq":6,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":1},"end":{"line":9,"offset":2}}]},{"seq":0,"type":"response","command":"definition","request_seq":7,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":1},"end":{"line":9,"offset":2}}]},{"seq":0,"type":"response","command":"definition","request_seq":8,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":16},"end":{"line":7,"offset":17}}]},{"seq":0,"type":"response","command":"definition","request_seq":9,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":18},"end":{"line":7,"offset":19}}]},{"seq":0,"type":"response","command":"definition","request_seq":10,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":16},"end":{"line":7,"offset":17}}]},{"seq":0,"type":"response","command":"definition","request_seq":11,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex1.ts","start":{"line":7,"offset":18},"end":{"line":7,"offset":19}}]}`);
    });

    it("Single line scan", function () {
        expect(response2).to.eql(['{"seq":0,"type":"response","command":"definition","request_seq":13,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":2111,"offset":1},"end":{"line":2610,"offset":2}}]}'].toString());
    })
});


describe("Tokenizing example file: ", function () {
    var tsserver = new tss.Tsserver();

    it("Tokenizing ex2.ts", function (done) {
        tsserver.scanFileForAllTokens("tests/examples/ex2.ts", (err, listOfResponses) => {
            winston.log('error', `Hey look. Tokens of ex2.ts: ${listOfResponses}`);
            done();
        });
    });

});
