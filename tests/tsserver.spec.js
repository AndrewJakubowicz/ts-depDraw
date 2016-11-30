var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;

var tss = require("../lib/tsserverWrap");

describe('Basic uses of a tsserver', function() {
    let s = new tss.Tsserver();
    var captured = "";
    before(function(done){
        this.timeout(4000);
        s.open("tests/examples/ex1.ts", function(err, d) {
            if (err){
                throw new Error("Basic use of a tsserver failed:", err);
            }
            captured = d.toString();
            done()
        });
    })
    
    it("Open and Close the tsserver", function() {
        // s.proc.stdin.write(`{"seq":1,"type":"request","command":"open","arguments":{"file":"tests/examples/ex1.ts"}}\n`);
        expect(captured).to.eq('Content-Length: 143\r\n\r\n{"seq":0,"type":"event","event":"configFileDiag","body":{"triggerFile":"tests/examples/ex1.ts","configFile":"tsconfig.json","diagnostics":[]}}\n')
    })
    after(()=>{
        setTimeout(()=>{s.kill();}, 3000);
    });
});

describe('Basic use of definition', function(){
    let s = new tss.Tsserver();
    var captured = "";
    before(function(done){
        this.timeout(4000);
        s.open("tests/examples/ex1.ts", function(err, d) {
            captured += d.toString();
        });
        s.definition('tests/examples/ex1.ts', 1, 14, function(err, d){
            console.log("Reading definition")
            captured += d.toString();
            done()
        });
    });
    it('Simple definition matches', function(){
        expect(captured).to.eq('Content-Length: 143\r\n\r\n{"seq":0,"type":"event","event":"configFileDiag","body":{"triggerFile":"tests/examples/ex1.ts","configFile":"tsconfig.json","diagnostics":[]}}\nContent-Length: 249\r\n\r\n{"seq":0,"type":"response","command":"definition","request_seq":1,"success":true,"body":[{"file":"/Users/Spyr1014/Projects/TypeScript/ts-depDraw/node_modules/@types/node/index.d.ts","start":{"line":2111,"offset":1},"end":{"line":2610,"offset":2}}]}\n');
    });
});