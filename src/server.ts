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
import * as express from 'express';

import * as path from 'path'

// Port defined
// TODO: add to config.
const PORT = 8080;

// Server creation
let server = express();

// This sets up a virtual path from '/' to the static directory.
// Adapted from https://expressjs.com/en/starter/static-files.html
// If this middleware fails, it will fall through to the next handler.
server.use('/', express.static('static'));

server.get('/hi', (req: express.Request, res: express.Response) => {
    res.send(`RAR! Recieved connection from: ${req.url}`);
});

server.listen(PORT, (err) => {
    if (err) {
        return console.log(`Error starting server: ${err}`);
    }
    console.log(`Server started and listening on port: ${PORT}`);
});