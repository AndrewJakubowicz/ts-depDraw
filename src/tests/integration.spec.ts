import * as chai from 'chai';
// var sinon = require("sinon");
var expect = chai.expect;
let should = chai.should();
var winston = require("../appLogger");

import * as server from '../server';
import * as http from 'http';
import * as child_process from 'child_process';

// I am monkey patching this for tests. This will prevent the use of mocha's
// location and instead mock project directory.
require.main.filename = `/Users/Spyr1014/Projects/TypeScript/ts-depDraw/examples/`;

/**
 * TODO: Make it so that anyone can test.
 */
global.tsconfigRootDir = '/Users/Spyr1014/Projects/TypeScript/ts-depDraw';
global.rootFile = 'examples/ex3.ts'

describe.only('Server api:', function () {

    this.timeout(5000);
    let serverProcess : child_process.ChildProcess;


    beforeEach(function (done) {
        serverProcess = child_process.spawn('npm', ['start', 'examples/ex2.ts']);

        serverProcess.stdout.on('data', function(data) {
            winston.log('trace', `Integration Test stdout: ${data}.`);
            // Calls the done callback as soon as server has started. (Reads the freaking stdout of the process).
            if (data.toString().indexOf('Server started and listening') !== -1){
                done()
            }
        });

        serverProcess.on('close', function() {
            winston.log('trace', `Closed server process`);
        });

    });

    afterEach(function(done){
        serverProcess.kill();
        done();
    })

    it('Call init on server', function (done) {
        http
            .get(`http://localhost:8080/api/init`, function (res) {
                winston.log('trace', `Call init on server test response:`, res);
                done();
            });
    });
    it('Call init on server', function (done) {
        http
            .get(`http://localhost:8080/api/init`, function (res) {
                winston.log('trace', `Call init on server test response:`, res);
                done();
            });
    });
    it('Call init on server', function (done) {
        http
            .get(`http://localhost:8080/api/init`, function (res) {
                winston.log('trace', `Call init on server test response:`, res);
                done();
            });
    });

});