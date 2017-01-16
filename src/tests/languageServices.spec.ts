// import * as chai from 'chai';
// // var sinon = require("sinon");
// var expect = chai.expect;
// let should = chai.should();
// var winston = require("../appLogger");

// import * as ts from 'typescript';
// import * as services from '../languageService';



// /**
//  * TODO: Make it so that anyone can test.
//  */
// global.tsconfigRootDir = '/Users/Spyr1014/Projects/TypeScript/ts-depDraw';
// global.rootFile = 'examples/ex3.ts';


// describe.only('Language Service Host Basics', function () {
//     it('fast navTree', function(){
//         const navTree = services.navTreeOnFile('examples/ex3.ts');
//         winston.log('trace', 'navtree:', navTree);
//     });

//     it('semantic classification', function(){
//         let semanticTokens = services.semanticClassifications('examples/ex3.ts', {line: 5,offset:1}, {start:7, offset: 21});
//         const newTokens = semanticTokens.spans.map(v => ts.SyntaxKind[v]);
//         winston.log('trace', 'semantic:', semanticTokens);
        
//     })
// })