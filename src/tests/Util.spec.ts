import * as chai from 'chai';
// var sinon = require("sinon");
var expect = chai.expect;
let should = chai.should();
var winston = require("../appLogger");

import * as jsonUtil from "../util/jsonUtil";


describe("JSON stringify and parse", function(){
    it("Stringify and parse simple", function(){
        let testObj = {
            someKey: "string . with strange sequences"
        }
        expect(testObj).to.eql(jsonUtil.parseEscaped(jsonUtil.stringifyEscape(testObj)));
    });

});