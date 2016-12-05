/**
 * Author: Andrew Jakubowicz
 * 
 * My first attempt to put together a nodejs server.
 * 
 * Material used:
 *  - http://blog.modulus.io/build-your-first-http-server-in-nodejs
 * 
 */

import * as http from 'http';

// Port defined
// TODO: add to config.
const PORT = 8080;

// Handler function
function handleRequest(request: http.IncomingMessage, response: http.ServerResponse) {
    response.end(`It works! Path Hit: ${request.url}`);
}

// Server creation
let server = http.createServer(handleRequest);

// Lets start our server
server.listen(PORT, function(){
    console.log(`Server listening on: http://localhost:${PORT}`);
});