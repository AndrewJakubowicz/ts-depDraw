import * as fs from "fs";

fs.existsSync("doesntexist.no");

console.log(adder(3,4));

function adder(a,b){
    return a + b;
}