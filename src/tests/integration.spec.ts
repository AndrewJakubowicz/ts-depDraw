import * as chai from 'chai';
// var sinon = require("sinon");
var expect = chai.expect;
let should = chai.should();
var winston = require("../appLogger");

import * as server from '../server';
import * as http from 'http';
import * as child_process from 'child_process';

import * as jsonUtil from '../util/jsonUtil';


/**
 * These tests open and close the program every time,
 * keeping them 'pure'.
 */
describe.only('Server api:', function () {
    this.timeout(15000);
    let serverProcess : child_process.ChildProcess;

    beforeEach(function (done) {
        serverProcess = child_process.spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['start', 'examples/ex2.ts']);

        serverProcess
            .stdout
            .on('data', function (data) {
                winston.log('trace', `Integration Test stdout: ${data}.`);
                // Calls the done callback as soon as server has started. (Reads the freaking
                // stdout of the process).
                if (data.toString().indexOf('Server started and listening') !== -1) {
                    done()
                }
            });

        serverProcess.on('error', function(d){
            winston.log('error', `error out: ${d}`);
        });

        serverProcess.on('close', function () {
            winston.log('trace', `Closed server process`);
        });

    });

    afterEach(function (done) {
        serverProcess.kill();
        /^win/.test(process.platform) ?
            (() => setTimeout(done, 3000))()
            : (() => setTimeout(done, 3000))()
    });



    it('Call getFileText on server', function (done) {
        http
            .get(`http://localhost:8080/api/getFileText?filePath=examples/ex2.ts`, function (res) {
                res.on('data', (data) => {
                    return Promise
                        .resolve()
                        .then(() => {
                            expect(JSON.parse(data.toString().replace(/(\r\n|\r|\n)/, '\n')))
                                .to
                                .deep
                                .equal(jsonUtil.parseEscaped('{"file":"examples%2Fex2.ts","text":"%0Afunction%20findMe()%7B%0A%20%20%20%20return%0A%7D%0A%0Aimport%20*%20as%20example1%20from%20%22.%2Fex1%22%3B%0A%0A%0AfindMe()%3B"}'.replace(/(\r\n|\r|\n)/, '\n')));
                        })
                        .then(done)
                        .catch(done);
                });
            });
    });


    it('Call /api/getTokenType on server', function (done) {
        http
            .get(`http://localhost:8080/api/getTokenType?filePath=examples/ex7_deepNesting.ts&line=7&offset=9`, function (res) {
                res.on('data', (data) => {
                    return Promise
                        .resolve()
                        .then(() => {
                            expect(jsonUtil.parseEscaped(data.toString()))
                                .to
                                .deep
                                .equal(jsonUtil.parseEscaped('{"seq":0,"type":"response","command":"quickinfo","request_seq":2,"success":true,"body":{"kind":"function","kindModifiers":"","start":{"line":7,"offset":9},"end":{"line":7,"offset":10},"displayString":"function%20D()%3A%20void","documentation":""}}'));
                        })
                        .then(done)
                        .catch(done);
                });
            });
    });

    it('Call /api/getTokenDependencies on server (filter out definition line)', function (done) {
        let correctResponse = [];

        http.get(`http://localhost:8080/api/getTokenDependencies?filePath=examples/ex2.ts&line=9&offset=1`, function (res) {
            res.on('data', (data) => {
                return Promise
                    .resolve()
                    .then(() => {
                        expect(JSON.parse(data.toString())).to.deep.equal(correctResponse);
                    })
                    .then(done)
                    .catch(done);
            });
        });
    });

    it('Call /api/getTokenDependents on server', function (done) {

        let correctResponse = [
            { kind: 'module',
                kindModifiers: '',
                start: { line: 1, offset: 13 },
                end: { line: 1, offset: 20 },
                displayString: '"ex4"',
                documentation: '',
                file: 'examples/ex4.ts' },
            { kind: 'function',
                kindModifiers: 'export',
                start: { line: 4, offset: 17 },
                end: { line: 4, offset: 28 },
                displayString: 'function betterAdder(c: any, d: any): any',
                documentation: '',
                file: 'examples/ex4.ts' },
            { kind: 'module',
                kindModifiers: '',
                start: { line: 1, offset: 13 },
                end: { line: 1, offset: 16 },
                displayString: '"ex3"',
                documentation: '',
                file: 'examples/ex3.ts' } ]

        http.get(`http://localhost:8080/api/getTokenDependents?filePath=examples/ex3.ts&line=7&offset=22`, function (res) {
                res.on('data', (data) => {
                    return Promise
                        .resolve()
                        .then(() => {
                            expect(JSON.parse(data.toString()))
                                .to
                                .deep
                                .equal(correctResponse);
                    })
                        .then(done)
                        .catch(done);
                });
            });
    });
});


// /**
//  * Testing if the server will open things a second time fast.
//  */
// describe('Server Cache:', function () {
//     this.timeout(4000);
//     let serverProcess : child_process.ChildProcess;

//     before(function (done) {
//         serverProcess = child_process.spawn('npm', ['start', 'examples/ex2.ts']);

//         serverProcess
//             .stdout
//             .on('data', function (data) {
//                 winston.log('trace', `Integration Test stdout: ${data}.`);
//                 // Calls the done callback as soon as server has started. (Reads the freaking
//                 // stdout of the process).
//                 if (data.toString().indexOf('Server started and listening') !== -1) {
//                     done()
//                 }
//             });

//         serverProcess.on('close', function () {
//             winston.log('trace', `Closed server process`);
//         });

//     });

//     after(function (done) {
//         serverProcess.kill();
//         done();
//     });

//     it('Call /api/getTextIdentifierTokensLocations on server', function (done) {
//         http
//             .get(`http://localhost:8080/api/getTextIdentifierTokensLocations?filePath=examples/ex2.ts`, function (res) {
//                 res.on('data', (data) => {
//                     return Promise
//                         .resolve()
//                         .then(() => {
//                             expect(jsonUtil.parseEscaped(data.toString()))
//                                 .to
//                                 .deep
//                                 .equal(jsonUtil.parseEscaped('[{"text":"%0A","type":"NewLineTrivia","start":{"line":1,"character":1}},{"text":"function","type":"FunctionKeyword","start":{"line":2,"character":1}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":2,"character":9}},{"text":"findMe","type":"Identifier","start":{"line":2,"character":10}},{"text":"(","type":"OpenParenToken","start":{"line":2,"character":16}},{"text":")","type":"CloseParenToken","start":{"line":2,"character":17}},{"text":"%7B","type":"FirstPunctuation","start":{"line":2,"character":18}},{"text":"%0A","type":"NewLineTrivia","start":{"line":2,"character":19}},{"text":"%20%20%20%20","type":"WhitespaceTrivia","start":{"line":3,"character":1}},{"text":"return","type":"ReturnKeyword","start":{"line":3,"character":5}},{"text":"%0A","type":"NewLineTrivia","start":{"line":3,"character":11}},{"text":"%7D","type":"CloseBraceToken","start":{"line":4,"character":1}},{"text":"%0A","type":"NewLineTrivia","start":{"line":4,"character":2}},{"text":"%0A","type":"NewLineTrivia","start":{"line":5,"character":1}},{"text":"import","type":"ImportKeyword","start":{"line":6,"character":1}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":7}},{"text":"*","type":"AsteriskToken","start":{"line":6,"character":8}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":9}},{"text":"as","type":"AsKeyword","start":{"line":6,"character":10}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":12}},{"text":"example1","type":"Identifier","start":{"line":6,"character":13}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":21}},{"text":"from","type":"FromKeyword","start":{"line":6,"character":22}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":26}},{"text":"%22.%2Fex1%22","type":"StringLiteral","start":{"line":6,"character":27}},{"text":"%3B","type":"SemicolonToken","start":{"line":6,"character":34}},{"text":"%0A","type":"NewLineTrivia","start":{"line":6,"character":35}},{"text":"%0A","type":"NewLineTrivia","start":{"line":7,"character":1}},{"text":"%0A","type":"NewLineTrivia","start":{"line":8,"character":1}},{"text":"findMe","type":"Identifier","start":{"line":9,"character":1}},{"text":"(","type":"OpenParenToken","start":{"line":9,"character":7}},{"text":")","type":"CloseParenToken","start":{"line":9,"character":8}},{"text":"%3B","type":"SemicolonToken","start":{"line":9,"character":9}}]'));
//                         })
//                         .then(done)
//                         .catch(done);
//                 });
//             });
//     });

//     it('Call /api/getTextIdentifierTokensLocations on server', function (done) {
//         http
//             .get(`http://localhost:8080/api/getTextIdentifierTokensLocations?filePath=examples/ex2.ts`, function (res) {
//                 res.on('data', (data) => {
//                     return Promise
//                         .resolve()
//                         .then(() => {
//                             expect(jsonUtil.parseEscaped(data.toString()))
//                                 .to
//                                 .deep
//                                 .equal(jsonUtil.parseEscaped('[{"text":"%0A","type":"NewLineTrivia","start":{"line":1,"character":1}},{"text":"function","type":"FunctionKeyword","start":{"line":2,"character":1}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":2,"character":9}},{"text":"findMe","type":"Identifier","start":{"line":2,"character":10}},{"text":"(","type":"OpenParenToken","start":{"line":2,"character":16}},{"text":")","type":"CloseParenToken","start":{"line":2,"character":17}},{"text":"%7B","type":"FirstPunctuation","start":{"line":2,"character":18}},{"text":"%0A","type":"NewLineTrivia","start":{"line":2,"character":19}},{"text":"%20%20%20%20","type":"WhitespaceTrivia","start":{"line":3,"character":1}},{"text":"return","type":"ReturnKeyword","start":{"line":3,"character":5}},{"text":"%0A","type":"NewLineTrivia","start":{"line":3,"character":11}},{"text":"%7D","type":"CloseBraceToken","start":{"line":4,"character":1}},{"text":"%0A","type":"NewLineTrivia","start":{"line":4,"character":2}},{"text":"%0A","type":"NewLineTrivia","start":{"line":5,"character":1}},{"text":"import","type":"ImportKeyword","start":{"line":6,"character":1}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":7}},{"text":"*","type":"AsteriskToken","start":{"line":6,"character":8}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":9}},{"text":"as","type":"AsKeyword","start":{"line":6,"character":10}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":12}},{"text":"example1","type":"Identifier","start":{"line":6,"character":13}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":21}},{"text":"from","type":"FromKeyword","start":{"line":6,"character":22}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":26}},{"text":"%22.%2Fex1%22","type":"StringLiteral","start":{"line":6,"character":27}},{"text":"%3B","type":"SemicolonToken","start":{"line":6,"character":34}},{"text":"%0A","type":"NewLineTrivia","start":{"line":6,"character":35}},{"text":"%0A","type":"NewLineTrivia","start":{"line":7,"character":1}},{"text":"%0A","type":"NewLineTrivia","start":{"line":8,"character":1}},{"text":"findMe","type":"Identifier","start":{"line":9,"character":1}},{"text":"(","type":"OpenParenToken","start":{"line":9,"character":7}},{"text":")","type":"CloseParenToken","start":{"line":9,"character":8}},{"text":"%3B","type":"SemicolonToken","start":{"line":9,"character":9}}]'));
//                         })
//                         .then(done)
//                         .catch(done);
//                 });
//             });
//     });

// });


describe('Stablity tests', function() {
    this.timeout(6000);
    let serverProcess : child_process.ChildProcess;

    beforeEach(function (done) {
        serverProcess = child_process.spawn('npm', ['start', 'examples/ex3.ts']);

        serverProcess
            .stdout
            .on('data', function (data) {
                winston.log('trace', `Integration Test stdout: ${data}.`);
                // Calls the done callback as soon as server has started. (Reads the freaking
                // stdout of the process)
                if (data.toString().indexOf('Server started and listening') !== -1) {
                    done()
                }
            });

        serverProcess.on('close', function () {
            winston.log('trace', `Closed server process`);
        });

    });

    afterEach(function (done) {
        serverProcess.kill();
        done();
    });

    it('get token dependents for a return statement failure.', function(done){
        http.get(`http://localhost:8080/api/getTokenDependents?filePath=examples/ex3.ts&line=4&offset=5`, function (res) {
            return Promise.resolve().then(() => {
                expect(res.statusCode).to.equal(204);
                expect(res.statusMessage).to.equal('No Content');
                done();
            }).catch(done);
        }); 
    });

    it('get definitions for a return statement failure.', function(done){
        http.get(`http://localhost:8080/api/getTokenDependencies?filePath=examples/ex3.ts&line=4&offset=5`, function (res) {
            return Promise.resolve().then(() => {
                expect(res.statusCode).to.equal(204);
                expect(res.statusMessage).to.equal('No Content');
                done();
            }).catch(done);
        }); 
    });

    it('get type for a return statement failure.', function(done){

        let correctResponse = {
            seq: 0,
            type: 'response',
            command: 'quickinfo',
            request_seq: 2,
            success: false,
            message: 'No content available.' }
        
        http.get(`http://localhost:8080/api/getTokenType?filePath=examples/ex3.ts&line=4&offset=5`, function (res) {
            return Promise.resolve().then(() => {
                expect(JSON.parse(res.read().toString())).to.deep.equal(correctResponse);
                done();
            }).catch(done);
        }); 
    });

    it('get token dependents for a function token failure.', function(done){
        http.get(`http://localhost:8080/api/getTokenDependents?filePath=examples/ex7_deepNesting.ts&line=22&offset=16`, function (res) {
            return Promise.resolve().then(() => {
                expect(res.statusCode).to.equal(204);
                expect(res.statusMessage).to.equal('No Content');
                done();
            }).catch(done);
        }); 
    });

    it('get definitions for a function with no dependencies or dependents', function(done){
        http.get(`http://localhost:8080/api/getTokenDependencies?filePath=examples/ex7_deepNesting.ts&line=22&offset=14`, function (res) {
            return Promise.resolve().then(() => {
                expect(res.statusCode).to.equal(200);
                res.on('data', (data) => {
                    expect(data.toString()).to.equal('[]');
                    done()
                })
            }).catch(done);
        }); 
    });

    it('make sure there arent repeats.', function(done){

        let correctResponse = [
            { text: '<global>',
                kind: 'script',
                kindModifiers: '',
                spans: [ { start: { line: 1, offset: 1 }, end: { line: 26, offset: 2 } } ] },
            { text: 'A',
                kind: 'function',
                kindModifiers: '',
                spans: [ { start: { line: 3, offset: 1 }, end: { line: 16, offset: 2 } } ] },
            { text: 'B',
                kind: 'function',
                kindModifiers: '',
                    spans: [ { start: { line: 5, offset: 5 }, end: { line: 15, offset: 6 } } ] }
        ]

        http.get(`http://localhost:8080/api/getTokenDependents?filePath=examples/ex7_deepNesting.ts&line=20&offset=10`, function (res) {
            return Promise.resolve().then(() => {
                expect(res.statusCode).to.equal(200);
                res.on('data', (data) => {
                    expect(JSON.parse(data.toString())).to.deep.equal(correctResponse);
                    done()
                })
            }).catch(done);
        }); 
    });
});

describe("Flawed Cases", function () {
    this.timeout(6000);
    let serverProcess : child_process.ChildProcess;

    beforeEach(function (done) {
        serverProcess = child_process.spawn('npm', ['start', 'examples/ex3.ts']);

        serverProcess
            .stdout
            .on('data', function (data) {
                winston.log('trace', `Integration Test stdout: ${data}.`);
                // Calls the done callback as soon as server has started. (Reads the freaking
                // stdout of the process)
                if (data.toString().indexOf('Server started and listening') !== -1) {
                    done()
                }
            });

        serverProcess.on('close', function () {
            winston.log('trace', `Closed server process`);
        });

    });

    afterEach(function (done) {
        serverProcess.kill();
        done();
    });


    it("defininitions locally", function(done){
        let correctResponse = [
                { kind: 'local function',
                    kindModifiers: '',
                    start: { line: 5, offset: 14 },
                    end: { line: 5, offset: 15 },
                    displayString: '(local function) B(): void',
                    "file": "examples/ex7_deepNesting.ts",
                    documentation: '' },
                { kind: 'function',
                    kindModifiers: '',
                    start: { line: 7, offset: 9 },
                    end: { line: 7, offset: 10 },
                    displayString: 'function D(): void',
                    "file": "examples/ex7_deepNesting.ts",
                    documentation: '' },
                { kind: 'local function',
                    kindModifiers: '',
                    start: { line: 10, offset: 18 },
                    end: { line: 10, offset: 19 },
                    displayString: '(local function) C(): void',
                    "file": "examples/ex7_deepNesting.ts",
                    documentation: '' } ]
        
    http.get(`http://localhost:8080/api/getTokenDependencies?filePath=examples/ex7_deepNesting.ts&line=3&offset=10`, function (res) {
        return Promise.resolve().then(() => {
            res.on('data', (data) => {
                expect(JSON.parse(data.toString())).to.deep.equal(correctResponse);
                done()
                })
            }).catch(done);
        });  
    });

    it("defininitions locally", function(done){
        let correctResponse = [
            { kind: 'parameter',
                kindModifiers: '',
                start: { line: 3, offset: 27 },
                end: { line: 3, offset: 28 },
                displayString: '(parameter) a: any',
                documentation: '',
                file: 'examples/ex3.ts' },
            { kind: 'parameter',
                kindModifiers: '',
                start: { line: 3, offset: 30 },
                end: { line: 3, offset: 31 },
                displayString: '(parameter) b: any',
                documentation: '',
                file: 'examples/ex3.ts' },
            { kind: 'parameter',
                kindModifiers: '',
                start: { line: 4, offset: 12 },
                end: { line: 4, offset: 13 },
                displayString: '(parameter) a: any',
                documentation: '',
                file: 'examples/ex3.ts' },
            { kind: 'parameter',
                kindModifiers: '',
                start: { line: 4, offset: 16 },
                end: { line: 4, offset: 17 },
                displayString: '(parameter) b: any',
                documentation: '',
                file: 'examples/ex3.ts' } ]
        
    http.get(`http://localhost:8080/api/getTokenDependencies?filePath=examples/ex4.ts&line=5&offset=22`, function (res) {
        return Promise.resolve().then(() => {
            res.on('data', (data) => {
                winston.log('trace', 'shit', JSON.parse(data.toString()));
                expect(JSON.parse(data.toString())).to.deep.equal(correctResponse);
                done()
                })
            }).catch(done);
        });  
    });
});
