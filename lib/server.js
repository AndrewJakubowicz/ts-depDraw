/**
 * Author: Andrew Jakubowicz
 *
 * My first attempt to put together a nodejs server.
 *
 * Material used:
 *  - http://blog.modulus.io/build-your-first-http-server-in-nodejs
 *
 */
"use strict";
var http = require('http');
// Port defined
// TODO: add to config.
var PORT = 8080;
// Handler function
function handleRequest(request, response) {
    response.end("It works! Path Hit: " + request.url);
}
// Server creation
var server = http.createServer(handleRequest);
// Lets start our server
server.listen(PORT, function () {
    console.log("Server listening on: http://localhost:" + PORT);
});
