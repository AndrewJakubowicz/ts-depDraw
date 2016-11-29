var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;

var tss = require("../lib/src/tsserverWrap");

describe('Basic uses of a tsserver', function() {
    let s = new tss.Tsserver();
    var captured = "";
    before(function(done){
        this.timeout(4000);
        s.open("tests/examples/ex1.ts", function(d) {
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
        s.open("examples/ex1.ts", function(d) {
            captured += d.toString();
        });
        s.definition('examples/ex1.ts', 1, 23, function(d){
            console.log("Reading definition")
            captured += d.toString();
            done()
        });
    });
    // TODO: fix this test.
    it('Simple definition matches', function(){
        console.log(captured);
        expect(2).to.eq(1);
    });
});