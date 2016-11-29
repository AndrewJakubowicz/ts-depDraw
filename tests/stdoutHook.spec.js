var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;

var hook = require("./util/stdoutHook");

describe('stdout hook', () => {
    it("capture console.log", () => {
        var captured = [];
        var unhook = hook.hook_stdout((string, encoding, fd) => {
            captured.push(string);
        });
        console.log("rar");
        console.log("lol");
        unhook();
        console.log("This isn't captured!");
        expect(captured).to.eql([ 'rar\n', 'lol\n' ]);
    });
});
