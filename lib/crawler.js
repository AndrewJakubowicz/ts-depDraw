/**
 * Author: Andrew Jakubowicz
 *
 * This file crawls and populates the graph in levelgraph
 */
"use strict";
// These two modules don't have typings defined for them.
var level = require("level-browserify");
var levelgraph = require("levelgraph");
var db = levelgraph(level("mydb"));
var triple = { subject: "a", predicate: "b", object: "c" };
db.put(triple, function (err) {
    // Do something after triple is inserted
});
db.get({ subject: "a" }, function (err, list) {
    console.log(list);
});
function crawler(tsserver, file, depth) {
}
exports.crawler = crawler;
;
