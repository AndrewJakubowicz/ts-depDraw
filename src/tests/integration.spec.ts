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
                        .catch(done)
                });
            });
    });
});