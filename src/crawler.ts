/**
 * Author: Andrew Jakubowicz
 */

// These two modules don't have typings defined for them.
let level = require("level-browserify");
let levelgraph =  require("levelgraph");

let db = levelgraph(level("mydb"));

let triple = { subject: "a", predicate: "b", object: "c" };
db.put(triple, function(err){
    // Do something after triple is inserted
});
db.get({ subject: "a" }, function(err, list){
    console.log(list);
})


export function crawler(tsserver, file, depth){
    
};