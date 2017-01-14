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

    it("Spawns a tsserver and tests open command", function(done){
        let wrapper = new tss.TsserverWrapper();

        let correctResponse = {
            seq: 0,
            type: 'event',
            event: 'configFileDiag',
            body:
            { triggerFile: 'examples/ex1.ts',
                configFile: 'tsconfig.json',
                diagnostics: [] } }

        wrapper.open("examples/ex1.ts")
            .then((response) => {
                expect(JSON.parse(response as string)).to.deep.equal(correctResponse);
                done();
        })
        .catch(done);
    });

    it("Tests the quickInfo command", function(done){
        let wrapper = new tss.TsserverWrapper();

        let correctResponse = {
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

        wrapper.open("examples/ex1.ts")
            .then(() => wrapper.quickinfo("examples/ex1.ts", 5, 15))
            .then(response => {
                winston.log('trace', 'quickinfo', JSON.parse(response as string));
                expect(JSON.parse(response as string)).to.deep.equal(correctResponse);
                done();
            })
            .catch(done);
    });

    it("Tests the definition command", function(done){
        let wrapper = new tss.TsserverWrapper();

        let correctResponse = {
            seq: 0,
            type: 'response',
            command: 'definition',
            request_seq: 1,
            success: true,
            body:
            [ { file: 'examples/ex1.ts',
                start: { line: 7, offset: 1 },
                end: { line: 9, offset: 2 } } ] }

        wrapper.open("examples/ex1.ts")
            .then(() => wrapper.definition("examples/ex1.ts", 5, 15))
            .then(response => {
                expect(JSON.parse(response as string)).to.deep.equal(correctResponse);
                done();
            })
            .catch(done);
    });

    it("Tests the references command", function(done){
        let wrapper = new tss.TsserverWrapper();

        let correctResponse = {
            seq: 0,
            type: 'response',
            command: 'references',
            request_seq: 1,
            success: true,
            body:
            { refs:
                [ { file: 'examples/ex1.ts',
                    start: { line: 5, offset: 13 },
                    lineText: 'console.log(adder(3,4));',
                    end: { line: 5, offset: 18 },
                    isWriteAccess: false,
                    isDefinition: false },
                    { file: 'examples/ex1.ts',
                    start: { line: 7, offset: 10 },
                    lineText: 'function adder(a,b){',
                    end: { line: 7, offset: 15 },
                    isWriteAccess: true,
                    isDefinition: true } ],
                symbolName: 'adder',
                symbolStartOffset: 13,
                symbolDisplayString: 'function adder(a: any, b: any): any' } }

        wrapper.open("examples/ex1.ts")
            .then(() => wrapper.references("examples/ex1.ts", 5, 15))
            .then(response => {
                expect(JSON.parse(response as string)).to.deep.equal(correctResponse);
                done();
            })
            .catch(done);
    });

    it("Tests the implementation command", function(done){
        let wrapper = new tss.TsserverWrapper();

        let correctResponse = {
            seq: 0,
            type: 'response',
            command: 'implementation',
            request_seq: 1,
            success: true,
            body:
            [ { file: 'examples/ex1.ts',
                start: { line: 7, offset: 1 },
                end: { line: 9, offset: 2 } } ] }
        
        wrapper.open("examples/ex1.ts")
            .then(() => wrapper.implementation("examples/ex1.ts", 5, 15))
            .then(response => {
                expect(JSON.parse(response as string)).to.deep.equal(correctResponse);
                done();
            })
            .catch(done);
    });

    it("Tests the navtree command", function(done){
        let wrapper = new tss.TsserverWrapper();

        let correctResponse = {
            seq: 0,
            type: 'response',
            command: 'navtree',
            request_seq: 1,
            success: true,
            body:
            { text: '"ex1"',
                kind: 'module',
                kindModifiers: '',
                spans: [ { start: { line: 1, offset: 1 }, end: { line: 9, offset: 2 } } ],
                childItems:
                [ { text: 'adder',
                    kind: 'function',
                    kindModifiers: '',
                    spans: [ { start: { line: 7, offset: 1 }, end: { line: 9, offset: 2 } } ] },
                    { text: 'fs',
                    kind: 'alias',
                    kindModifiers: '',
                    spans: [ { start: { line: 1, offset: 8 }, end: { line: 1, offset: 15 } } ] } ] } }

        wrapper.open("examples/ex1.ts")
            .then(() => wrapper.navtree("examples/ex1.ts"))
            .then(response => {
                expect(JSON.parse(response as string)).to.deep.equal(correctResponse);
                done();
            })
            .catch(done);
    });

})