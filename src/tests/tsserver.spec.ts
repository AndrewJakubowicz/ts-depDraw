import * as chai from 'chai';
// var sinon = require("sinon");
var expect = chai.expect;
let should = chai.should();
var winston = require("../appLogger");

import * as tss from "../tsserverWrap";

var fs = require('fs');
import * as path from 'path';

// I am monkey patching this for tests. (oh god :P)
// This will prevent the use of mocha's location and mock project directory.
require.main.filename = `/Users/Spyr1014/Projects/TypeScript/ts-depDraw/examples/`;


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
                winston.log('error', `Basic use of a tsserver failed: ${err}`);
                should.not.exist(err)
                done()
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
                winston.log('error', `Reference method failed: ${err}`);
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
    let tsserver = new tss.Tsserver();

    // Remember to clean up the server once you're finished.
    after(function () {
        tsserver.kill();
    });

    before(function (done) {
        this.timeout(10000);

        tsserver.scanFile("tests/examples/ex1.ts", (err, r) => {
            if (err) {
                winston.log('error', err);
                done()
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
    let response;
    let response2;
    let tsserver = new tss.Tsserver();

    // Remember to clean up the server once you're finished.
    after(function () {
        tsserver.kill();
    });

    before(function (done) {
        this.timeout(10000);

        tsserver.scanFileBetween("tests/examples/ex1.ts", [1, 9], (err, r) => {
            if (err) {
                winston.log('error', err);
                done();
            }
            winston.log('data', r[0]);
            response = r.map((currentRequestResponse) => {
                return currentRequestResponse[1]
            })
                .toString();


            tsserver.scanFileBetween("tests/examples/ex1.ts", [1, 1], (err, r) => {
                if (err) {
                    winston.log('error', err);
                    done()
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

    // Remember to clean up the server once you're finished.
    after(function () {
        tsserver.kill();
    });

    /**
     * TODO: Revisit optimizing the token scanner.
     *  You could theoretically clean tokens while waiting for tsserver.
     *  Instead here we're waiting for full population, then do a clean.
     */
    it("Tokenizing ex2.ts", function (done) {
        tsserver.scanFileForAllTokens("tests/examples/ex2.ts", (err, listOfResponses) => {
            tsserver.combineRequestReturn(listOfResponses).then(function (...listOfTokens) {
                expect(listOfTokens).to.eql(JSON.parse('[[{"tokenText":"function","tokenType":"FunctionKeyword","start":{"line":2,"offset":1}},{"tokenText":"findMe","tokenType":"Identifier","isDefinition":true,"start":{"line":2,"offset":10},"references":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex2.ts","start":{"line":9,"offset":1},"lineText":"findMe();","end":{"line":9,"offset":7},"isWriteAccess":false,"isDefinition":false}],"end":{"line":4,"offset":2}},{"tokenText":"(","tokenType":"OpenParenToken","start":{"line":2,"offset":16}},{"tokenText":")","tokenType":"CloseParenToken","start":{"line":2,"offset":17}},{"tokenText":"{","tokenType":"FirstPunctuation","start":{"line":2,"offset":18}},{"tokenText":"return","tokenType":"ReturnKeyword","start":{"line":3,"offset":5}},{"tokenText":"}","tokenType":"CloseBraceToken","start":{"line":4,"offset":1}},{"tokenText":"import","tokenType":"ImportKeyword","start":{"line":6,"offset":1}},{"tokenText":"*","tokenType":"AsteriskToken","start":{"line":6,"offset":8}},{"tokenText":"as","tokenType":"AsKeyword","start":{"line":6,"offset":10}},{"tokenText":"example1","tokenType":"Identifier","isDefinition":true,"start":{"line":6,"offset":13},"references":[],"end":{"line":9,"offset":2}},{"tokenText":"from","tokenType":"FromKeyword","start":{"line":6,"offset":22}},{"tokenText":"\\"./ex1\\"","tokenType":"StringLiteral","start":{"line":6,"offset":27}},{"tokenText":";","tokenType":"SemicolonToken","start":{"line":6,"offset":34}},{"tokenText":"findMe","tokenType":"Identifier","isDefinition":false,"start":{"line":9,"offset":1},"references":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex2.ts","start":{"line":2,"offset":10},"lineText":"function findMe(){","end":{"line":2,"offset":16},"isWriteAccess":true,"isDefinition":true}]},{"tokenText":"(","tokenType":"OpenParenToken","start":{"line":9,"offset":7}},{"tokenText":")","tokenType":"CloseParenToken","start":{"line":9,"offset":8}},{"tokenText":";","tokenType":"SemicolonToken","start":{"line":9,"offset":9}}]]'))
                done();
            }).catch(err => {
                winston.log('error', `Failed to create token list: ${err}`);
            });
        });
    });

    /**
     * Cool short form of grabbing tokens.
     */
    it("Tokenizing ex2.ts shortForm", function(done){
        tsserver.scanFileForAllTokensPretty('tests/examples/ex2.ts')
            .then(tokenList => {
                expect(tokenList).to.eql(JSON.parse('[[{"tokenText":"function","tokenType":"FunctionKeyword","start":{"line":2,"offset":1}},{"tokenText":"findMe","tokenType":"Identifier","isDefinition":true,"start":{"line":2,"offset":10},"references":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex2.ts","start":{"line":9,"offset":1},"lineText":"findMe();","end":{"line":9,"offset":7},"isWriteAccess":false,"isDefinition":false}],"end":{"line":4,"offset":2}},{"tokenText":"(","tokenType":"OpenParenToken","start":{"line":2,"offset":16}},{"tokenText":")","tokenType":"CloseParenToken","start":{"line":2,"offset":17}},{"tokenText":"{","tokenType":"FirstPunctuation","start":{"line":2,"offset":18}},{"tokenText":"return","tokenType":"ReturnKeyword","start":{"line":3,"offset":5}},{"tokenText":"}","tokenType":"CloseBraceToken","start":{"line":4,"offset":1}},{"tokenText":"import","tokenType":"ImportKeyword","start":{"line":6,"offset":1}},{"tokenText":"*","tokenType":"AsteriskToken","start":{"line":6,"offset":8}},{"tokenText":"as","tokenType":"AsKeyword","start":{"line":6,"offset":10}},{"tokenText":"example1","tokenType":"Identifier","isDefinition":true,"start":{"line":6,"offset":13},"references":[],"end":{"line":9,"offset":2}},{"tokenText":"from","tokenType":"FromKeyword","start":{"line":6,"offset":22}},{"tokenText":"\\"./ex1\\"","tokenType":"StringLiteral","start":{"line":6,"offset":27}},{"tokenText":";","tokenType":"SemicolonToken","start":{"line":6,"offset":34}},{"tokenText":"findMe","tokenType":"Identifier","isDefinition":false,"start":{"line":9,"offset":1},"references":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex2.ts","start":{"line":2,"offset":10},"lineText":"function findMe(){","end":{"line":2,"offset":16},"isWriteAccess":true,"isDefinition":true}]},{"tokenText":"(","tokenType":"OpenParenToken","start":{"line":9,"offset":7}},{"tokenText":")","tokenType":"CloseParenToken","start":{"line":9,"offset":8}},{"tokenText":";","tokenType":"SemicolonToken","start":{"line":9,"offset":9}}]]'))
                done();
            }).catch(err => {
                winston.log('error', `Error in promise scanFileForAllTokensPretty: ${err}`);
            })
    })
});


describe("Token compressing", function () {
    let s = new tss.Tsserver();
    this.timeout(5000);
    let savedToken: tss.TokenIdentifierData;

    // Remember to clean up the server once you're finished.
    after(function () {
        s.kill();
    });

    it("Simplifying reference token", function (done) {
        let filePath = 'tests/examples/ex5.ts';
        let appDir = path.dirname(require.main.filename);
        let tssPath = filePath;
        filePath = appDir + '/' + filePath;
        s.open(filePath, function (err, res, req) {
            if (err) {
                winston.log('error', `Reference method failed: ${err}`);
            }
        });
        s.lookUpReferences(tssPath, 7, 17, {
            tokenText: "betterConsoleLog",
            tokenType: "Identifier",
            filePath: filePath
        }).then(function (reqResTuple) {
            let req = JSON.parse(String(reqResTuple[0]));
            let res = JSON.parse(reqResTuple[1]);

            let token = tss.createReferenceToken(req, res);
            savedToken = token;

            expect(token).to.eql({
                tokenText: 'betterConsoleLog',
                tokenType: 'Identifier',
                isDefinition: false,
                start: { line: 7, offset: 17 },
                references:
                [{
                    file: '/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex3.ts',
                    start: { line: 7, offset: 5 },
                    lineText: 'ex5.betterConsoleLog(adderTest(1, 2));',
                    end: { line: 7, offset: 21 },
                    isWriteAccess: false,
                    isDefinition: false
                },
                {
                    file: '/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex5.ts',
                    start: { line: 7, offset: 17 },
                    lineText: 'export function betterConsoleLog(a){',
                    end: { line: 7, offset: 33 },
                    isWriteAccess: true,
                    isDefinition: true
                }]
            })
            done();
        }).catch(function (err) {
            winston.log('error', `Promise error in references: ${err}`)
        });
    });

    it("Removing repeats from token", function () {
        let scrubbedToken = tss.removeDuplicateReference(savedToken, 'tests/examples/ex5.ts');
        winston.log('trace', `Scrubbed savedToken`);
        expect(scrubbedToken).to.eql({
            tokenText: 'betterConsoleLog',
            tokenType: 'Identifier',
            isDefinition: true,
            start: { line: 7, offset: 17 },
            references:
            [{
                file: '/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/ex3.ts',
                start: { line: 7, offset: 5 },
                lineText: 'ex5.betterConsoleLog(adderTest(1, 2));',
                end: { line: 7, offset: 21 },
                isWriteAccess: false,
                isDefinition: false
            }]
        })
    });
});
