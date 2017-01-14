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


describe.only("Test TsserverWrapper", function(){
    this.timeout(10000);
    it("Spawns a tsserver", function(done){
        let wrapper = new tss.TsserverWrapper();
        wrapper.open("examples/ex1.ts")
            .then((response) => {
                console.log("THIS IS THE RESPONSE:", response)
                done();
        });
    });
    it("Spawns a tsserver", function(done){
        let wrapper = new tss.TsserverWrapper();
        wrapper.open("examples/ex1.ts")
            .then(() => wrapper.quickinfo("examples/ex1.ts", 5, 15))
            .then(response => {
                expect(response).to.equal(`{"seq":0,"type":"response","command":"quickinfo","request_seq":1,"success":true,"body":{"kind":"function","kindModifiers":"","start":{"line":5,"offset":13},"end":{"line":5,"offset":18},"displayString":"function adder(a: any, b: any): any","documentation":""}`);
                done();
            })
    });
})