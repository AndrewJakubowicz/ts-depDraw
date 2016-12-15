import * as chai from 'chai';
// var sinon = require("sinon");
var expect = chai.expect;
let should = chai.should();
var winston = require("../appLogger");

import * as tss from "../tsserverWrap";
import * as jsonUtil from "../util/jsonUtil";

var fs = require('fs');
import * as path from 'path';

// I am monkey patching this for tests. (oh god :P) This will prevent the use of
// mocha's location and mock project directory.
require.main.filename = `/Users/Spyr1014/Projects/TypeScript/ts-depDraw/examples/`;

/**
 * TODO: Make it so that anyone can test.
 */
global.tsconfigRootDir = '/Users/Spyr1014/Projects/TypeScript/ts-depDraw';
global.rootFile = 'tests/examples/ex3.ts'

describe('Basic uses of a tsserver:', function () {
    this.timeout(10000);
    var s = new tss.Tsserver();

    // Remember to clean up the server once you're finished.
    after(function () {
        s.kill();
    });

    it("Open a file on the tsserver", function (done) {
        s
            .open("tests/examples/ex1.ts", function (err, d) {
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
                    .eq('{"seq":0,"type":"event","event":"configFileDiag","body":{"triggerFile":"tests/ex' +
                            'amples/ex1.ts","configFile":"tsconfig.json","diagnostics":[]}}');
                done()
            });
    });

    it('Simple definition matches', function (done) {
        var captured = "";
        s.open("tests/examples/ex1.ts", function (err, d) {

            captured += d.toString();
        });
        s.definition('tests/examples/ex1.ts', 1, 14, function (err, d) {
            console.log("Reading definition", d);
            captured += d.toString();

            expect(captured)
                .to
                .eql('{"seq":0,"type":"event","event":"configFileDiag","body":{"triggerFile":"tests/ex' +
                        'amples/ex1.ts","configFile":"tsconfig.json","diagnostics":[]}}{"seq":0,"type":"r' +
                        'esponse","command":"definition","request_seq":2,"success":true,"body":[{"file":"' +
                        '/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.' +
                        'ts","start":{"line":2111,"offset":1},"end":{"line":2610,"offset":2}}]}');
            done()
        });
    });

    it("Simple references method", function (done) {
        var captured = "";
        s.open('tests/examples/ex5.ts', function (err, d, req) {
            if (err) {
                winston.log('error', `Reference method failed: ${err}`);
            }
        });
        s.references('tests/examples/ex5.ts', 7, 17, function (err, d, req) {
            captured = d.toString();
            expect(captured)
                .to
                .eql('{"seq":0,"type":"response","command":"references","request_seq":4,"success":true' +
                        ',"body":{"refs":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/tests/e' +
                        'xamples/ex3.ts","start":{"line":7,"offset":5},"lineText":"ex5.betterConsoleLog(a' +
                        'dderTest(1, 2));","end":{"line":7,"offset":21},"isWriteAccess":false,"isDefiniti' +
                        'on":false},{"file":"tests/examples/ex5.ts","start":{"line":7,"offset":17},"lineT' +
                        'ext":"export function betterConsoleLog(a){","end":{"line":7,"offset":33},"isWrit' +
                        'eAccess":true,"isDefinition":true}],"symbolName":"betterConsoleLog","symbolStart' +
                        'Offset":17,"symbolDisplayString":"function betterConsoleLog(a: any): void"}}');
            done();
        });
    });

    it('Navtree function', function (done) {
        s
            .navtree('tests/examples/ex4.ts', function (err, res, req) {
                console.log(res, req);
                done();
            });
    });

    it('Testing if define will give function scope of betterConsoleLog', function (done) {
        s
            .definition('tests/examples/ex5.ts', 7, 17, function (err, res, req) {

                expect(res.toString())
                    .to
                    .eql(JSON.stringify({
                        "seq": 0,
                        "type": "response",
                        "command": "definition",
                        "request_seq": 5,
                        "success": true,
                        "body": [
                            {
                                "file": "tests/examples/ex5.ts",
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
                    }))
                done()
            });
    });
});

describe.only('Getting token positions and types', function () {
    it('Token Data for a commented file', function (done) {
        tss
            .scanFileForIdentifierTokens("tests/examples/commentedExample.ts")
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
