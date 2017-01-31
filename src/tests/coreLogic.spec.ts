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
            const getFileText = factoryGetFileText({
                tssServer: {
                    open: () => Promise.resolve()
                },
                winston,
                readFile: fs.readFile
            });

            getFileText(global.rootFile)
                .then(strResponse => expect((strResponse as string).replace(/(\\r\\n|\\r|\\n)/g, '\\n')).to.be.a("number"))
                .then(_ => done())
                .catch(done);
        })
    })
})