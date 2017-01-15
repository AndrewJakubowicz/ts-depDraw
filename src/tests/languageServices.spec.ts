import * as chai from 'chai';
// var sinon = require("sinon");
var expect = chai.expect;
let should = chai.should();
var winston = require("../appLogger");

import * as ts from 'typescript';
import * as services from '../languageService';



/**
 * TODO: Make it so that anyone can test.
 */
global.tsconfigRootDir = '/Users/Spyr1014/Projects/TypeScript/ts-depDraw';
global.rootFile = 'examples/ex3.ts';


describe.only('Language Service Host Basics', function () {
    it('definition', function(){
        const navTree = services.navTreeOnFile('examples/ex3.ts');
        winston.log('trace', 'navtree:', navTree);
    })
})