
var randomName = "Andrew";

function someAdder(a, b){
    return a + b;
}

var tempString = `This is a tricky ${randomName} template string`;

var harder = `Harder ${() => {return someAdder(2, 3)}} one;`;

var thisIsNotTemplate = 5 + 3 * someAdder(1, 2);

var nestHell = ` This template ${`string ${`str${'-'}ing`}`} is nested!`

var multiline = ` Wow
this ${someAdder(2,3)} is 
a multiline!`