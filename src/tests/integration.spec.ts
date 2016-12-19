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
describe('Server api:', function () {
    this.timeout(4000);
    let serverProcess : child_process.ChildProcess;

    beforeEach(function (done) {
        serverProcess = child_process.spawn('npm', ['start', 'examples/ex2.ts']);

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

        serverProcess.on('close', function () {
            winston.log('trace', `Closed server process`);
        });

    });

    afterEach(function (done) {
        serverProcess.kill();
        done();
    })

    it('Call init on server with escaping', function (done) {
        http
            .get(`http://localhost:8080/api/init`, function (res) {
                res.on('data', (data) => {
                    return Promise
                        .resolve()
                        .then(() => {
                            expect(jsonUtil.parseEscaped(data.toString()))
                                .to
                                .equal(jsonUtil.parseEscaped('"examples%2Fex2.ts"'));
                        })
                        .then(done)
                        .catch(done)
                });
            });
    });

    it('Call init on server without escaping', function (done) {
        http
            .get(`http://localhost:8080/api/init`, function (res) {
                res.on('data', (data) => {
                    return Promise
                        .resolve()
                        .then(() => {
                            expect(data.toString())
                                .to
                                .equal('"examples%2Fex2.ts"');
                        })
                        .then(done)
                        .catch(done)
                });
            });
    });


    it('Call getFileText on server', function (done) {
        http
            .get(`http://localhost:8080/api/getFileText?filePath=examples/ex2.ts`, function (res) {
                res.on('data', (data) => {
                    return Promise
                        .resolve()
                        .then(() => {
                            expect(jsonUtil.parseEscaped(data.toString()))
                                .to
                                .deep
                                .equal(jsonUtil.parseEscaped('{"file":"examples%2Fex2.ts","text":"%0Afunction%20findMe()%7B%0A%20%20%20%20return%0A%7D%0A%0Aimport%20*%20as%20example1%20from%20%22.%2Fex1%22%3B%0A%0A%0AfindMe()%3B"}'));
                        })
                        .then(done)
                        .catch(done);
                });
            });
    });

    it('Call /api/getTextIdentifierTokensLocations on server', function (done) {
        http
            .get(`http://localhost:8080/api/getTextIdentifierTokensLocations?filePath=examples/ex2.ts`, function (res) {
                res.on('data', (data) => {
                    return Promise
                        .resolve()
                        .then(() => {
                            expect(jsonUtil.parseEscaped(data.toString()))
                                .to
                                .deep
                                .equal(jsonUtil.parseEscaped('[{"text":"%0A","type":"NewLineTrivia","start":{"line":1,"character":1}},{"text":"function","type":"FunctionKeyword","start":{"line":2,"character":1}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":2,"character":9}},{"text":"findMe","type":"Identifier","start":{"line":2,"character":10}},{"text":"(","type":"OpenParenToken","start":{"line":2,"character":16}},{"text":")","type":"CloseParenToken","start":{"line":2,"character":17}},{"text":"%7B","type":"FirstPunctuation","start":{"line":2,"character":18}},{"text":"%0A","type":"NewLineTrivia","start":{"line":2,"character":19}},{"text":"%20%20%20%20","type":"WhitespaceTrivia","start":{"line":3,"character":1}},{"text":"return","type":"ReturnKeyword","start":{"line":3,"character":5}},{"text":"%0A","type":"NewLineTrivia","start":{"line":3,"character":11}},{"text":"%7D","type":"CloseBraceToken","start":{"line":4,"character":1}},{"text":"%0A","type":"NewLineTrivia","start":{"line":4,"character":2}},{"text":"%0A","type":"NewLineTrivia","start":{"line":5,"character":1}},{"text":"import","type":"ImportKeyword","start":{"line":6,"character":1}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":7}},{"text":"*","type":"AsteriskToken","start":{"line":6,"character":8}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":9}},{"text":"as","type":"AsKeyword","start":{"line":6,"character":10}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":12}},{"text":"example1","type":"Identifier","start":{"line":6,"character":13}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":21}},{"text":"from","type":"FromKeyword","start":{"line":6,"character":22}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":26}},{"text":"%22.%2Fex1%22","type":"StringLiteral","start":{"line":6,"character":27}},{"text":"%3B","type":"SemicolonToken","start":{"line":6,"character":34}},{"text":"%0A","type":"NewLineTrivia","start":{"line":6,"character":35}},{"text":"%0A","type":"NewLineTrivia","start":{"line":7,"character":1}},{"text":"%0A","type":"NewLineTrivia","start":{"line":8,"character":1}},{"text":"findMe","type":"Identifier","start":{"line":9,"character":1}},{"text":"(","type":"OpenParenToken","start":{"line":9,"character":7}},{"text":")","type":"CloseParenToken","start":{"line":9,"character":8}},{"text":"%3B","type":"SemicolonToken","start":{"line":9,"character":9}}]'));
                        })
                        .then(done)
                        .catch(done);
                });
            });
    });

    // it.only('Call /api/getTokenDependencies on server', function (done) {
    //     http
    //         .get(`http://localhost:8080/api/getTokenDependencies?filePath=examples/ex2.ts`, function (res) {
    //             res.on('data', (data) => {
    //                 return Promise
    //                     .resolve()
    //                     .then(() => {
    //                         expect(jsonUtil.parseEscaped(data.toString()))
    //                             .to
    //                             .deep
    //                             .equal(jsonUtil.parseEscaped('[{"text":"%0A","type":"NewLineTrivia","start":{"line":1,"character":1}},{"text":"function","type":"FunctionKeyword","start":{"line":2,"character":1}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":2,"character":9}},{"text":"findMe","type":"Identifier","start":{"line":2,"character":10}},{"text":"(","type":"OpenParenToken","start":{"line":2,"character":16}},{"text":")","type":"CloseParenToken","start":{"line":2,"character":17}},{"text":"%7B","type":"FirstPunctuation","start":{"line":2,"character":18}},{"text":"%0A","type":"NewLineTrivia","start":{"line":2,"character":19}},{"text":"%20%20%20%20","type":"WhitespaceTrivia","start":{"line":3,"character":1}},{"text":"return","type":"ReturnKeyword","start":{"line":3,"character":5}},{"text":"%0A","type":"NewLineTrivia","start":{"line":3,"character":11}},{"text":"%7D","type":"CloseBraceToken","start":{"line":4,"character":1}},{"text":"%0A","type":"NewLineTrivia","start":{"line":4,"character":2}},{"text":"%0A","type":"NewLineTrivia","start":{"line":5,"character":1}},{"text":"import","type":"ImportKeyword","start":{"line":6,"character":1}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":7}},{"text":"*","type":"AsteriskToken","start":{"line":6,"character":8}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":9}},{"text":"as","type":"AsKeyword","start":{"line":6,"character":10}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":12}},{"text":"example1","type":"Identifier","start":{"line":6,"character":13}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":21}},{"text":"from","type":"FromKeyword","start":{"line":6,"character":22}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":26}},{"text":"%22.%2Fex1%22","type":"StringLiteral","start":{"line":6,"character":27}},{"text":"%3B","type":"SemicolonToken","start":{"line":6,"character":34}},{"text":"%0A","type":"NewLineTrivia","start":{"line":6,"character":35}},{"text":"%0A","type":"NewLineTrivia","start":{"line":7,"character":1}},{"text":"%0A","type":"NewLineTrivia","start":{"line":8,"character":1}},{"text":"findMe","type":"Identifier","start":{"line":9,"character":1}},{"text":"(","type":"OpenParenToken","start":{"line":9,"character":7}},{"text":")","type":"CloseParenToken","start":{"line":9,"character":8}},{"text":"%3B","type":"SemicolonToken","start":{"line":9,"character":9}}]'));
    //                     })
    //                     .then(done)
    //                     .catch(done);
    //             });
    //         });
    // });
});


/**
 * Testing if the server will open thigns a second time fast.
 */
describe('Server Cache:', function () {
    this.timeout(4000);
    let serverProcess : child_process.ChildProcess;

    before(function (done) {
        serverProcess = child_process.spawn('npm', ['start', 'examples/ex2.ts']);

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

        serverProcess.on('close', function () {
            winston.log('trace', `Closed server process`);
        });

    });

    after(function (done) {
        serverProcess.kill();
        done();
    });

    it('Call /api/getTextIdentifierTokensLocations on server', function (done) {
        http
            .get(`http://localhost:8080/api/getTextIdentifierTokensLocations?filePath=examples/ex2.ts`, function (res) {
                res.on('data', (data) => {
                    return Promise
                        .resolve()
                        .then(() => {
                            expect(jsonUtil.parseEscaped(data.toString()))
                                .to
                                .deep
                                .equal(jsonUtil.parseEscaped('[{"text":"%0A","type":"NewLineTrivia","start":{"line":1,"character":1}},{"text":"function","type":"FunctionKeyword","start":{"line":2,"character":1}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":2,"character":9}},{"text":"findMe","type":"Identifier","start":{"line":2,"character":10}},{"text":"(","type":"OpenParenToken","start":{"line":2,"character":16}},{"text":")","type":"CloseParenToken","start":{"line":2,"character":17}},{"text":"%7B","type":"FirstPunctuation","start":{"line":2,"character":18}},{"text":"%0A","type":"NewLineTrivia","start":{"line":2,"character":19}},{"text":"%20%20%20%20","type":"WhitespaceTrivia","start":{"line":3,"character":1}},{"text":"return","type":"ReturnKeyword","start":{"line":3,"character":5}},{"text":"%0A","type":"NewLineTrivia","start":{"line":3,"character":11}},{"text":"%7D","type":"CloseBraceToken","start":{"line":4,"character":1}},{"text":"%0A","type":"NewLineTrivia","start":{"line":4,"character":2}},{"text":"%0A","type":"NewLineTrivia","start":{"line":5,"character":1}},{"text":"import","type":"ImportKeyword","start":{"line":6,"character":1}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":7}},{"text":"*","type":"AsteriskToken","start":{"line":6,"character":8}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":9}},{"text":"as","type":"AsKeyword","start":{"line":6,"character":10}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":12}},{"text":"example1","type":"Identifier","start":{"line":6,"character":13}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":21}},{"text":"from","type":"FromKeyword","start":{"line":6,"character":22}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":26}},{"text":"%22.%2Fex1%22","type":"StringLiteral","start":{"line":6,"character":27}},{"text":"%3B","type":"SemicolonToken","start":{"line":6,"character":34}},{"text":"%0A","type":"NewLineTrivia","start":{"line":6,"character":35}},{"text":"%0A","type":"NewLineTrivia","start":{"line":7,"character":1}},{"text":"%0A","type":"NewLineTrivia","start":{"line":8,"character":1}},{"text":"findMe","type":"Identifier","start":{"line":9,"character":1}},{"text":"(","type":"OpenParenToken","start":{"line":9,"character":7}},{"text":")","type":"CloseParenToken","start":{"line":9,"character":8}},{"text":"%3B","type":"SemicolonToken","start":{"line":9,"character":9}}]'));
                        })
                        .then(done)
                        .catch(done);
                });
            });
    });

    it('Call /api/getTextIdentifierTokensLocations on server', function (done) {
        http
            .get(`http://localhost:8080/api/getTextIdentifierTokensLocations?filePath=examples/ex2.ts`, function (res) {
                res.on('data', (data) => {
                    return Promise
                        .resolve()
                        .then(() => {
                            expect(jsonUtil.parseEscaped(data.toString()))
                                .to
                                .deep
                                .equal(jsonUtil.parseEscaped('[{"text":"%0A","type":"NewLineTrivia","start":{"line":1,"character":1}},{"text":"function","type":"FunctionKeyword","start":{"line":2,"character":1}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":2,"character":9}},{"text":"findMe","type":"Identifier","start":{"line":2,"character":10}},{"text":"(","type":"OpenParenToken","start":{"line":2,"character":16}},{"text":")","type":"CloseParenToken","start":{"line":2,"character":17}},{"text":"%7B","type":"FirstPunctuation","start":{"line":2,"character":18}},{"text":"%0A","type":"NewLineTrivia","start":{"line":2,"character":19}},{"text":"%20%20%20%20","type":"WhitespaceTrivia","start":{"line":3,"character":1}},{"text":"return","type":"ReturnKeyword","start":{"line":3,"character":5}},{"text":"%0A","type":"NewLineTrivia","start":{"line":3,"character":11}},{"text":"%7D","type":"CloseBraceToken","start":{"line":4,"character":1}},{"text":"%0A","type":"NewLineTrivia","start":{"line":4,"character":2}},{"text":"%0A","type":"NewLineTrivia","start":{"line":5,"character":1}},{"text":"import","type":"ImportKeyword","start":{"line":6,"character":1}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":7}},{"text":"*","type":"AsteriskToken","start":{"line":6,"character":8}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":9}},{"text":"as","type":"AsKeyword","start":{"line":6,"character":10}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":12}},{"text":"example1","type":"Identifier","start":{"line":6,"character":13}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":21}},{"text":"from","type":"FromKeyword","start":{"line":6,"character":22}},{"text":"%20","type":"WhitespaceTrivia","start":{"line":6,"character":26}},{"text":"%22.%2Fex1%22","type":"StringLiteral","start":{"line":6,"character":27}},{"text":"%3B","type":"SemicolonToken","start":{"line":6,"character":34}},{"text":"%0A","type":"NewLineTrivia","start":{"line":6,"character":35}},{"text":"%0A","type":"NewLineTrivia","start":{"line":7,"character":1}},{"text":"%0A","type":"NewLineTrivia","start":{"line":8,"character":1}},{"text":"findMe","type":"Identifier","start":{"line":9,"character":1}},{"text":"(","type":"OpenParenToken","start":{"line":9,"character":7}},{"text":")","type":"CloseParenToken","start":{"line":9,"character":8}},{"text":"%3B","type":"SemicolonToken","start":{"line":9,"character":9}}]'));
                        })
                        .then(done)
                        .catch(done);
                });
            });
    });

});
