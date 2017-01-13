import * as chai from 'chai';
// var sinon = require("sinon");
var expect = chai.expect;
let should = chai.should();
var winston = require("../appLogger");

import * as tss from "../tsserverWrap";
import * as jsonUtil from "../util/jsonUtil";

var fs = require('fs');
import * as path from 'path';


/**
 * TODO: Make it so that anyone can test.
 */
global.tsconfigRootDir = '/Users/Spyr1014/Projects/TypeScript/ts-depDraw';
global.rootFile = 'examples/ex3.ts';


describe("Test TsserverWrapper", function(){
    this.timeout(10000);
    it("Spawns a tsserver", function(done){
        let wrapper = new tss.TsserverWrapper();
        wrapper.open("singletonTsserver.spec.ts")
            .then(console.log);
        setTimeout(done, 4000);
    })
})