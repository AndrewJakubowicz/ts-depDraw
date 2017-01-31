import * as chai from 'chai';
var expect = chai.expect;
var winston = require("../appLogger");


import * as fs from 'fs';
import * as tss from "../tsserverWrap";

/** TODO: make config  */
global.tsconfigRootDir = '/Users/Spyr1014/Projects/TypeScript/ts-depDraw';
global.rootFile = 'examples/ex3.ts';

import factoryGetFileText from '../factoryGetFileText';
import factoryGetTokenType from '../factoryGetTokenType';


describe("Core features", function(){
    this.timeout(10000);

    describe("getFileText", function(){
        it("getFileText", function(done){
            const correctResponse = JSON.parse('{"file":"examples/ex3.ts","text":"import * as ex5 from \\"./ex5\\";\\n\\nexport function adderTest(a, b){\\n    return a + b;\\n}\\n\\nex5.betterConsoleLog(adderTest(1, 2));\\n\\n\\n\\n"}');
            const getFileText = factoryGetFileText({
                tssServer: {
                    open: () => Promise.resolve()
                },
                winston,
                readFile: fs.readFile
            });

            getFileText(global.rootFile)
                .then(strResponse => expect(JSON.parse((strResponse as string).replace(/(\\r\\n|\\r|\\n)/g, '\\n')))
                    .to.deep.equal(correctResponse))
                .then(_ => done())
                .catch(done);
        });

        it("getFileText tssServer", function(done){
            const tssServer = new tss.TsserverWrapper();

            const correctResponse = JSON.parse('{"file":"examples/ex3.ts","text":"import * as ex5 from \\"./ex5\\";\\n\\nexport function adderTest(a, b){\\n    return a + b;\\n}\\n\\nex5.betterConsoleLog(adderTest(1, 2));\\n\\n\\n\\n"}');
            const getFileText = factoryGetFileText({
                tssServer,
                winston,
                readFile: fs.readFile
            });

            getFileText(global.rootFile)
                .then(strResponse => expect(JSON.parse((strResponse as string).replace(/(\\r\\n|\\r|\\n)/g, '\\n')))
                    .to.deep.equal(correctResponse))
                .then(_ => done())
                .catch(done);
        })

    });

    describe("getTokenType", function(){
        it("getTokenType", function(done){
            const tssServer = new tss.TsserverWrapper();

            const correctResponse = {
                seq: 0,
                type: 'response',
                command: 'quickinfo',
                request_seq: 1,
                success: true,
                body:
                { kind: 'function',
                    kindModifiers: '',
                    start: { line: 5, offset: 13 },
                    end: { line: 5, offset: 18 },
                    displayString: 'function adder(a: any, b: any): any',
                    documentation: '' } }

            
            const getTokenType = factoryGetTokenType({
                tssServer,
                winston
            });

            getTokenType("examples/ex1.ts", 5, 15)
                .then()
                .then(strResponse => expect(JSON.parse((strResponse as string).replace(/(\\r\\n|\\r|\\n)/g, '\\n')))
                        .to.deep.equal(correctResponse))
                    .then(_ => done())
                    .catch(done);
        })
    })

    describe("getTokenDependencies", function(){
        it("getTokenDependencies", function(){

        })
    })
})