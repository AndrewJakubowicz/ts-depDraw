/**
 * Author: Andrew Jakubowicz
 *
 * My first attempt to put together a nodejs server.
 *
 */
"use strict";
var express = require('express');
// Port defined
// TODO: add to config.
var PORT = 8080;
// Server creation
var server = express();
// This sets up a virtual path from '/' to the static directory.
// Adapted from https://expressjs.com/en/starter/static-files.html
// If this middleware fails, it will fall through to the next handler.
server.use('/', express.static('static'));
// Simple api request
server.get('/api/helloworld', function (req, res) {
    res.send("Hello World!");
});
server.get('/api/getJSONtest', function (req, res) {
    var testObject = {
        name: "Andrew",
        score: 2,
        friends: {
            names: "bob",
            inventory: ["apples", "bananana"]
        }
    };
    res.send(JSON.stringify(testObject));
});
server.listen(PORT, function (err) {
    if (err) {
        return console.log("Error starting server: " + err);
    }
    console.log("Server started and listening on port: " + PORT);
});
