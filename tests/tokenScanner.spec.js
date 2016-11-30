var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;

var tkScanner = require("../lib/tokenScanner");

/**
 * Mocking the global dependencies of the node app.
 * TODO: make sure this path reflects the root of the directory we are trying to traverse.
 * ASSUMPTION: That it's this project that is being traversed.'
 * Answer here: http://stackoverflow.com/a/18721515
 */
var path = require("path");
global.appRoot = path.resolve(__dirname);


describe("Single File Scan", function(){
    it("Small file scan", function(done){
        this.timeout(0);
        tkScanner.scanFile("tests/examples/ex1.ts", (err, response)=>{
            if (err) {
                console.error(err);
            } else {
                console.log('I HAVE RESPONSE:', response);
            }
            done();
        });
    });
});

// describe("Single File Scan", function(){
//     it("Small file scan", function(done){
//         this.timeout(0);
//         tkScanner.scanFile("node_modules/@types/node/index.d.ts", (err, response)=>{
//             if (err) {
//                 console.error(err);
//             } else {
//                 console.log('I HAVE RESPONSE:', response);
//             }
//             done();
//         });
//     });
// });