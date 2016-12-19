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
global.rootFile = 'examples/ex3.ts'





describe('Basic uses of a tsserver:', function () {
    this.timeout(10000);
    var s = new tss.Tsserver();

    // Remember to clean up the server once you're finished.
    after(function () {
        s.kill();
    });

    it("Open a file on the tsserver", function (done) {
        s
            .open("examples/ex1.ts", function (err, d) {
                if (err) {
                    winston.log('error', `Basic use of a tsserver failed: ${err}`);
                    should
                        .not
                        .exist(err)
                    done()
                }
                var captured = d.toString();
                expect(captured)
                    .to
                    .eq('{"seq":0,"type":"event","event":"configFileDiag","body":{"triggerFile":"ex' +
                            'amples/ex1.ts","configFile":"tsconfig.json","diagnostics":[]}}');
                done()
            });
    });

    it('Simple definition matches', function (done) {
        var captured = "";
        s.open("examples/ex1.ts", function (err, d) {

            captured += d.toString();
        });
        s.definition('examples/ex1.ts', 1, 14, function (err, d) {
            console.log("Reading definition", d);
            captured += d.toString();

            expect(captured)
                .to
                .eql('{"seq":0,"type":"event","event":"configFileDiag","body":{"triggerFile":"ex' +
                        'amples/ex1.ts","configFile":"tsconfig.json","diagnostics":[]}}{"seq":0,"type":"r' +
                        'esponse","command":"definition","request_seq":2,"success":true,"body":[{"file":"' +
                        '/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.' +
                        'ts","start":{"line":2111,"offset":1},"end":{"line":2610,"offset":2}}]}');
            done()
        });
    });

    it("Simple references method", function (done) {
        var captured = "";
        s.open('examples/ex5.ts', function (err, d, req) {
            if (err) {
                winston.log('error', `Reference method failed: ${err}`);
            }
        });
        s.references('examples/ex5.ts', 7, 17, function (err, d, req) {
            captured = d.toString();
            expect(captured)
                .to
                .eql('{"seq":0,"type":"response","command":"references","request_seq":4,"success":true' +
                        ',"body":{"refs":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/e' +
                        'xamples/ex3.ts","start":{"line":7,"offset":5},"lineText":"ex5.betterConsoleLog(a' +
                        'dderTest(1, 2));","end":{"line":7,"offset":21},"isWriteAccess":false,"isDefiniti' +
                        'on":false},{"file":"examples/ex5.ts","start":{"line":7,"offset":17},"lineText":"' +
                        'export function betterConsoleLog(a){","end":{"line":7,"offset":33},"isWriteAcces' +
                        's":true,"isDefinition":true}],"symbolName":"betterConsoleLog","symbolStartOffset' +
                        '":17,"symbolDisplayString":"function betterConsoleLog(a: any): void"}}');
            done();
        });
    });

    // This example shows how to get the object out and stringify it.
    it('Navtree method', function (done) {
        s.open("examples/ex4.ts", function (err, d) {
            if (err) {
                done(err);
            }
        });
        s
            .navtree('examples/ex4.ts', function (err, res, req) {
                expect(jsonUtil.stringifyEscape(JSON.parse(res))).to.deep.equal(jsonUtil.stringifyEscape({"seq":0,"type":"response","command":"navtree","request_seq":6,"success":true,"body":{"text":"\"ex4\"","kind":"module","kindModifiers":"","spans":[{"start":{"line":1,"offset":1},"end":{"line":11,"offset":2}}],"childItems":[{"text":"betterAdder","kind":"function","kindModifiers":"export","spans":[{"start":{"line":4,"offset":1},"end":{"line":6,"offset":2}}]},{"text":"betterConsoleLog","kind":"function","kindModifiers":"export","spans":[{"start":{"line":9,"offset":1},"end":{"line":11,"offset":2}}]},{"text":"example","kind":"alias","kindModifiers":"","spans":[{"start":{"line":1,"offset":8},"end":{"line":1,"offset":20}}]}]}}));
                done();
            });
    });

    it('quickinfo method', function (done) {
        s.open("examples/ex1.ts", function (err, d) {
            if (err) {
                done(err);
            }
        });
        s
            .quickinfo('examples/ex1.ts', 1, 14, function (err, res, req) {
                expect(res.toString()).to.equal(`{"seq":0,"type":"response","command":"quickinfo","request_seq":8,"success":true,"body":{"kind":"alias","kindModifiers":"","start":{"line":1,"offset":13},"end":{"line":1,"offset":15},"displayString":"import fs","documentation":""}}`);
                done();
            });
    });

    it('Testing if define will give function scope of betterConsoleLog', function (done) {
        s
            .definition('examples/ex5.ts', 7, 17, function (err, res, req) {

                expect(JSON.parse(res))
                    .to.deep
                    .equal({
                        "seq": 0,
                        "type": "response",
                        "command": "definition",
                        "request_seq": 9,
                        "success": true,
                        "body": [
                            {
                                "file": "examples/ex5.ts",
                                "start": {
                                    "line": 7,
                                    "offset": 1
                                },
                                "end": {
                                    "line": 9,
                                    "offset": 2
                                }
                            }
                        ]
                    })
                done()
            });
    });
});

describe('Getting token positions and types', function () {
    it('Token Data for a commented file', function (done) {
        tss
            .scanFileForIdentifierTokens("examples/commentedExample.ts")
            .then((tokenArray) => {
                expect(tokenArray)
                    .deep
                    .equal([
                        {
                            text: '/**\n * Look at these comments\n */',
                            type: 'MultiLineCommentTrivia',
                            start: {
                                line: 1,
                                character: 1
                            }
                        }, {
                            text: '\n',
                            type: 'NewLineTrivia',
                            start: {
                                line: 3,
                                character: 4
                            }
                        }, {
                            text: '\n',
                            type: 'NewLineTrivia',
                            start: {
                                line: 4,
                                character: 1
                            }
                        }, {
                            text: '\n',
                            type: 'NewLineTrivia',
                            start: {
                                line: 5,
                                character: 1
                            }
                        }, {
                            text: 'function',
                            type: 'FunctionKeyword',
                            start: {
                                line: 6,
                                character: 1
                            }
                        }, {
                            text: ' ',
                            type: 'WhitespaceTrivia',
                            start: {
                                line: 6,
                                character: 9
                            }
                        }, {
                            text: 'rar',
                            type: 'Identifier',
                            start: {
                                line: 6,
                                character: 10
                            }
                        }, {
                            text: '(',
                            type: 'OpenParenToken',
                            start: {
                                line: 6,
                                character: 13
                            }
                        }, {
                            text: 'a',
                            type: 'Identifier',
                            start: {
                                line: 6,
                                character: 14
                            }
                        }, {
                            text: ',',
                            type: 'CommaToken',
                            start: {
                                line: 6,
                                character: 15
                            }
                        }, {
                            text: 'b',
                            type: 'Identifier',
                            start: {
                                line: 6,
                                character: 16
                            }
                        }, {
                            text: ')',
                            type: 'CloseParenToken',
                            start: {
                                line: 6,
                                character: 17
                            }
                        }, {
                            text: '{',
                            type: 'FirstPunctuation',
                            start: {
                                line: 6,
                                character: 18
                            }
                        }, {
                            text: '  ',
                            type: 'WhitespaceTrivia',
                            start: {
                                line: 6,
                                character: 19
                            }
                        }, {
                            text: '// Comment here wow!',
                            type: 'FirstTriviaToken',
                            start: {
                                line: 6,
                                character: 21
                            }
                        }, {
                            text: '\n',
                            type: 'NewLineTrivia',
                            start: {
                                line: 6,
                                character: 41
                            }
                        }, {
                            text: '    ',
                            type: 'WhitespaceTrivia',
                            start: {
                                line: 7,
                                character: 1
                            }
                        }, {
                            text: 'return',
                            type: 'ReturnKeyword',
                            start: {
                                line: 7,
                                character: 5
                            }
                        }, {
                            text: ' ',
                            type: 'WhitespaceTrivia',
                            start: {
                                line: 7,
                                character: 11
                            }
                        }, {
                            text: 'a',
                            type: 'Identifier',
                            start: {
                                line: 7,
                                character: 12
                            }
                        }, {
                            text: ' ',
                            type: 'WhitespaceTrivia',
                            start: {
                                line: 7,
                                character: 13
                            }
                        }, {
                            text: '+',
                            type: 'PlusToken',
                            start: {
                                line: 7,
                                character: 14
                            }
                        }, {
                            text: ' ',
                            type: 'WhitespaceTrivia',
                            start: {
                                line: 7,
                                character: 15
                            }
                        }, {
                            text: 'b',
                            type: 'Identifier',
                            start: {
                                line: 7,
                                character: 16
                            }
                        }, {
                            text: '\n',
                            type: 'NewLineTrivia',
                            start: {
                                line: 7,
                                character: 17
                            }
                        }, {
                            text: '}',
                            type: 'CloseBraceToken',
                            start: {
                                line: 8,
                                character: 1
                            }
                        }, {
                            text: '\n',
                            type: 'NewLineTrivia',
                            start: {
                                line: 8,
                                character: 2
                            }
                        }, {
                            text: '/** Some more stuff here\n Make the comments interesting\n */',
                            type: 'MultiLineCommentTrivia',
                            start: {
                                line: 9,
                                character: 1
                            }
                        }, {
                            text: '\n',
                            type: 'NewLineTrivia',
                            start: {
                                line: 11,
                                character: 4
                            }
                        }, {
                            text: '\n',
                            type: 'NewLineTrivia',
                            start: {
                                line: 12,
                                character: 1
                            }
                        }, {
                            text: '// I recon these ruin everything.',
                            type: 'FirstTriviaToken',
                            start: {
                                line: 13,
                                character: 1
                            }
                        }, {
                            text: '\n',
                            type: 'NewLineTrivia',
                            start: {
                                line: 13,
                                character: 34
                            }
                        }, {
                            text: '/** Stuff */',
                            type: 'MultiLineCommentTrivia',
                            start: {
                                line: 14,
                                character: 1
                            }
                        }, {
                            text: ' ',
                            type: 'WhitespaceTrivia',
                            start: {
                                line: 14,
                                character: 13
                            }
                        }, {
                            text: 'rar',
                            type: 'Identifier',
                            start: {
                                line: 14,
                                character: 14
                            }
                        }, {
                            text: '(',
                            type: 'OpenParenToken',
                            start: {
                                line: 14,
                                character: 17
                            }
                        }, {
                            text: '2',
                            type: 'FirstLiteralToken',
                            start: {
                                line: 14,
                                character: 18
                            }
                        }, {
                            text: ',',
                            type: 'CommaToken',
                            start: {
                                line: 14,
                                character: 19
                            }
                        }, {
                            text: '3',
                            type: 'FirstLiteralToken',
                            start: {
                                line: 14,
                                character: 20
                            }
                        }, {
                            text: ')',
                            type: 'CloseParenToken',
                            start: {
                                line: 14,
                                character: 21
                            }
                        }, {
                            text: ';',
                            type: 'SemicolonToken',
                            start: {
                                line: 14,
                                character: 22
                            }
                        }
                    ])
            })
            .then(done)
            .catch(done);
    });

    it('Token Data for a commented file, checking if cache works.', function (done) {
        tss
            .scanFileForIdentifierTokens("examples/commentedExample.ts")
            .then((tokenArray) => {
                expect(tokenArray)
                    .deep
                    .equal([
                        {
                            text: '/**\n * Look at these comments\n */',
                            type: 'MultiLineCommentTrivia',
                            start: {
                                line: 1,
                                character: 1
                            }
                        }, {
                            text: '\n',
                            type: 'NewLineTrivia',
                            start: {
                                line: 3,
                                character: 4
                            }
                        }, {
                            text: '\n',
                            type: 'NewLineTrivia',
                            start: {
                                line: 4,
                                character: 1
                            }
                        }, {
                            text: '\n',
                            type: 'NewLineTrivia',
                            start: {
                                line: 5,
                                character: 1
                            }
                        }, {
                            text: 'function',
                            type: 'FunctionKeyword',
                            start: {
                                line: 6,
                                character: 1
                            }
                        }, {
                            text: ' ',
                            type: 'WhitespaceTrivia',
                            start: {
                                line: 6,
                                character: 9
                            }
                        }, {
                            text: 'rar',
                            type: 'Identifier',
                            start: {
                                line: 6,
                                character: 10
                            }
                        }, {
                            text: '(',
                            type: 'OpenParenToken',
                            start: {
                                line: 6,
                                character: 13
                            }
                        }, {
                            text: 'a',
                            type: 'Identifier',
                            start: {
                                line: 6,
                                character: 14
                            }
                        }, {
                            text: ',',
                            type: 'CommaToken',
                            start: {
                                line: 6,
                                character: 15
                            }
                        }, {
                            text: 'b',
                            type: 'Identifier',
                            start: {
                                line: 6,
                                character: 16
                            }
                        }, {
                            text: ')',
                            type: 'CloseParenToken',
                            start: {
                                line: 6,
                                character: 17
                            }
                        }, {
                            text: '{',
                            type: 'FirstPunctuation',
                            start: {
                                line: 6,
                                character: 18
                            }
                        }, {
                            text: '  ',
                            type: 'WhitespaceTrivia',
                            start: {
                                line: 6,
                                character: 19
                            }
                        }, {
                            text: '// Comment here wow!',
                            type: 'FirstTriviaToken',
                            start: {
                                line: 6,
                                character: 21
                            }
                        }, {
                            text: '\n',
                            type: 'NewLineTrivia',
                            start: {
                                line: 6,
                                character: 41
                            }
                        }, {
                            text: '    ',
                            type: 'WhitespaceTrivia',
                            start: {
                                line: 7,
                                character: 1
                            }
                        }, {
                            text: 'return',
                            type: 'ReturnKeyword',
                            start: {
                                line: 7,
                                character: 5
                            }
                        }, {
                            text: ' ',
                            type: 'WhitespaceTrivia',
                            start: {
                                line: 7,
                                character: 11
                            }
                        }, {
                            text: 'a',
                            type: 'Identifier',
                            start: {
                                line: 7,
                                character: 12
                            }
                        }, {
                            text: ' ',
                            type: 'WhitespaceTrivia',
                            start: {
                                line: 7,
                                character: 13
                            }
                        }, {
                            text: '+',
                            type: 'PlusToken',
                            start: {
                                line: 7,
                                character: 14
                            }
                        }, {
                            text: ' ',
                            type: 'WhitespaceTrivia',
                            start: {
                                line: 7,
                                character: 15
                            }
                        }, {
                            text: 'b',
                            type: 'Identifier',
                            start: {
                                line: 7,
                                character: 16
                            }
                        }, {
                            text: '\n',
                            type: 'NewLineTrivia',
                            start: {
                                line: 7,
                                character: 17
                            }
                        }, {
                            text: '}',
                            type: 'CloseBraceToken',
                            start: {
                                line: 8,
                                character: 1
                            }
                        }, {
                            text: '\n',
                            type: 'NewLineTrivia',
                            start: {
                                line: 8,
                                character: 2
                            }
                        }, {
                            text: '/** Some more stuff here\n Make the comments interesting\n */',
                            type: 'MultiLineCommentTrivia',
                            start: {
                                line: 9,
                                character: 1
                            }
                        }, {
                            text: '\n',
                            type: 'NewLineTrivia',
                            start: {
                                line: 11,
                                character: 4
                            }
                        }, {
                            text: '\n',
                            type: 'NewLineTrivia',
                            start: {
                                line: 12,
                                character: 1
                            }
                        }, {
                            text: '// I recon these ruin everything.',
                            type: 'FirstTriviaToken',
                            start: {
                                line: 13,
                                character: 1
                            }
                        }, {
                            text: '\n',
                            type: 'NewLineTrivia',
                            start: {
                                line: 13,
                                character: 34
                            }
                        }, {
                            text: '/** Stuff */',
                            type: 'MultiLineCommentTrivia',
                            start: {
                                line: 14,
                                character: 1
                            }
                        }, {
                            text: ' ',
                            type: 'WhitespaceTrivia',
                            start: {
                                line: 14,
                                character: 13
                            }
                        }, {
                            text: 'rar',
                            type: 'Identifier',
                            start: {
                                line: 14,
                                character: 14
                            }
                        }, {
                            text: '(',
                            type: 'OpenParenToken',
                            start: {
                                line: 14,
                                character: 17
                            }
                        }, {
                            text: '2',
                            type: 'FirstLiteralToken',
                            start: {
                                line: 14,
                                character: 18
                            }
                        }, {
                            text: ',',
                            type: 'CommaToken',
                            start: {
                                line: 14,
                                character: 19
                            }
                        }, {
                            text: '3',
                            type: 'FirstLiteralToken',
                            start: {
                                line: 14,
                                character: 20
                            }
                        }, {
                            text: ')',
                            type: 'CloseParenToken',
                            start: {
                                line: 14,
                                character: 21
                            }
                        }, {
                            text: ';',
                            type: 'SemicolonToken',
                            start: {
                                line: 14,
                                character: 22
                            }
                        }
                    ])
            })
            .then(done)
            .catch(done);
    });
});


describe('NavTree method examples and quickinfo', function () {
    this.timeout(10000);
    var s = new tss.Tsserver();

    // Remember to clean up the server once you're finished.
    after(function () {
        s.kill();
    });


    // Notice that the outer most scope is the global scope.
    // Then you can traverse the children to close in on the scope.
    it('Navtree method with deep nesting', function (done) {
        s.open("examples/ex7_deepNesting.ts", function (err, d) {
            if (err) {
                done(err);
            }
        });
        s
            .navtree('examples/ex7_deepNesting.ts', function (err, res, req) {
                expect(jsonUtil.stringifyEscape(JSON.parse(res))).to.deep.equal(jsonUtil.stringifyEscape({"seq":0,"type":"response","command":"navtree","request_seq":1,"success":true,"body":{"text":"<global>","kind":"script","kindModifiers":"","spans":[{"start":{"line":1,"offset":1},"end":{"line":26,"offset":2}}],"childItems":[{"text":"A","kind":"function","kindModifiers":"","spans":[{"start":{"line":3,"offset":1},"end":{"line":16,"offset":2}}],"childItems":[{"text":"B","kind":"function","kindModifiers":"","spans":[{"start":{"line":5,"offset":5},"end":{"line":15,"offset":6}}],"childItems":[{"text":"C","kind":"function","kindModifiers":"","spans":[{"start":{"line":10,"offset":9},"end":{"line":14,"offset":10}}]}]}]},{"text":"D","kind":"function","kindModifiers":"","spans":[{"start":{"line":20,"offset":1},"end":{"line":26,"offset":2}}],"childItems":[{"text":"E","kind":"function","kindModifiers":"","spans":[{"start":{"line":22,"offset":5},"end":{"line":24,"offset":6}}]}]}]}}));
                done();
            });
    });


    it('QuickInfo Example 1', function (done) {
        s
            .quickinfo('examples/ex7_deepNesting.ts',7, 9, function (err, res, req) {
                expect(jsonUtil.parseEscaped(res)).to.deep.equal(jsonUtil.parseEscaped(jsonUtil.stringifyEscape({"seq":0,"type":"response","command":"quickinfo","request_seq":2,"success":true,"body":{"kind":"function","kindModifiers":"","start":{"line":7,"offset":9},"end":{"line":7,"offset":10},"displayString":"function D(): void","documentation":""}})));
                done();
            });
    });

});