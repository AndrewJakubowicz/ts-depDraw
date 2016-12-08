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

/**
 * TODO: Make it so that anyone can test.
 */
global.tsconfigRootDir = '/Users/Spyr1014/Projects/TypeScript/ts-depDraw';
global.rootFile = 'tests/examples/ex3.ts'



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

    it('Testing if define will give function scope of betterConsoleLog', function (done) {
        s.definition('tests/examples/ex5.ts', 7, 17, function (err, res, req) {

            expect(res.toString()).to.eql(JSON.stringify({ "seq": 0, "type": "response", "command": "definition", "request_seq": 5, "success": true, "body": [{ "file": "tests/examples/ex5.ts", "start": { "line": 7, "offset": 1 }, "end": { "line": 9, "offset": 2 } }] }))
            done()
        });
    });
});



describe("Tokenizing example file: ", function () {
    var tsserver = new tss.Tsserver();
    this.timeout(5000);
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
                done();
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
                done();
            });
    })
});

// TODO: comment test.
describe.only("Tokenizing file with comments", function(){
    let tsserver = new tss.Tsserver();
    // Remember to clean up the server once you're finished.
    after(function () {
        tsserver.kill();
    });
    this.timeout(10000);
    it("Small example", function (done){
        tsserver.scanFileForAllTokensPretty('tests/examples/commentedExample.ts')
            .then(tokenList => {
                expect(tokenList).to.eql(JSON.parse(`[{"tokenText":"*","tokenType":"AsteriskToken","start":{"line":2,"offset":2}},{"tokenText":"Look","tokenType":"Identifier","start":null},{"tokenText":"at","tokenType":"Identifier","start":null},{"tokenText":"these","tokenType":"Identifier","start":null},{"tokenText":"comments","tokenType":"Identifier","start":null},{"tokenText":"*","tokenType":"AsteriskToken","start":{"line":3,"offset":2}},{"tokenText":"/","tokenType":"SlashToken","start":{"line":3,"offset":3}},{"tokenText":"function","tokenType":"FunctionKeyword","start":{"line":6,"offset":1}},{"tokenText":"rar","tokenType":"Identifier","isDefinition":true,"start":{"line":6,"offset":10},"references":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/commentedExample.ts","start":{"line":11,"offset":1},"lineText":"rar(2,3);","end":{"line":11,"offset":4},"isWriteAccess":false,"isDefinition":false}],"end":{"line":8,"offset":2}},{"tokenText":"(","tokenType":"OpenParenToken","start":{"line":6,"offset":13}},{"tokenText":"a","tokenType":"Identifier","isDefinition":true,"start":{"line":6,"offset":14},"references":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/commentedExample.ts","start":{"line":7,"offset":12},"lineText":"    return a + b","end":{"line":7,"offset":13},"isWriteAccess":false,"isDefinition":false}],"end":{"line":6,"offset":15}},{"tokenText":",","tokenType":"CommaToken","start":{"line":6,"offset":15}},{"tokenText":"b","tokenType":"Identifier","isDefinition":true,"start":{"line":6,"offset":16},"references":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/commentedExample.ts","start":{"line":7,"offset":16},"lineText":"    return a + b","end":{"line":7,"offset":17},"isWriteAccess":false,"isDefinition":false}],"end":{"line":6,"offset":17}},{"tokenText":")","tokenType":"CloseParenToken","start":{"line":6,"offset":17}},{"tokenText":"{","tokenType":"FirstPunctuation","start":{"line":6,"offset":18}},{"tokenText":"return","tokenType":"ReturnKeyword","start":{"line":7,"offset":5}},{"tokenText":"a","tokenType":"Identifier","isDefinition":false,"start":{"line":7,"offset":12},"references":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/commentedExample.ts","start":{"line":6,"offset":14},"lineText":"function rar(a,b){","end":{"line":6,"offset":15},"isWriteAccess":true,"isDefinition":true}]},{"tokenText":"+","tokenType":"PlusToken","start":{"line":7,"offset":14}},{"tokenText":"b","tokenType":"Identifier","isDefinition":false,"start":{"line":7,"offset":16},"references":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/commentedExample.ts","start":{"line":6,"offset":16},"lineText":"function rar(a,b){","end":{"line":6,"offset":17},"isWriteAccess":true,"isDefinition":true}]},{"tokenText":"}","tokenType":"CloseBraceToken","start":{"line":8,"offset":1}},{"tokenText":"rar","tokenType":"Identifier","isDefinition":false,"start":{"line":11,"offset":1},"references":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/examples/commentedExample.ts","start":{"line":6,"offset":10},"lineText":"function rar(a,b){","end":{"line":6,"offset":13},"isWriteAccess":true,"isDefinition":true}]},{"tokenText":"(","tokenType":"OpenParenToken","start":{"line":11,"offset":4}},{"tokenText":"2","tokenType":"FirstLiteralToken","start":{"line":11,"offset":5}},{"tokenText":",","tokenType":"CommaToken","start":{"line":11,"offset":6}},{"tokenText":"3","tokenType":"FirstLiteralToken","start":{"line":11,"offset":7}},{"tokenText":")","tokenType":"CloseParenToken","start":{"line":11,"offset":8}},{"tokenText":";","tokenType":"SemicolonToken","start":{"line":11,"offset":9}}]`))
                done();
                
            }).catch(err=>{
                winston.log('error', `Error in commented file scanFileForAllTokensPretty: ${err}`);
                done();
        });
    });
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
        let appDir = global.tsconfigRootDir;
        let tssPath = filePath;
        filePath = path.join(appDir,filePath);
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

    it("Removing repeats from token", function (done) {
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
        done();
    });
});
