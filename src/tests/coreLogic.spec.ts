import * as chai from 'chai';
var expect = chai.expect;
let should = chai.should();
var winston = require("../appLogger");

import * as server from '../server';

import * as fs from 'fs';

/** TODO: make config  */
global.tsconfigRootDir = '/Users/Spyr1014/Projects/TypeScript/ts-depDraw';
global.rootFile = 'examples/ex3.ts';

import factoryGetFileText from '../factoryGetFileText';


describe.only("Core features", function(){

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
        
    });
})