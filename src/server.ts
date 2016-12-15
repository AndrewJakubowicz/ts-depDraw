/**
 * Author: Andrew Jakubowicz
 * 
 * My first attempt to put together a nodejs server.
 * 
 * 
 * 
 * API:
 * 
 * 
 * /api/init
 *  - returns the root file for the project.
 * 
 * /api/getFileText
 *  - returns plain text of the file.
 * 
 * /api/getTextIdentifierTokensLocations
 *  - returns token data. Can be used to recreate the display.
 *
 * 
 */

import * as http from 'http';
import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';

import * as winston from "./appLogger";
import * as tss from "./tsserverWrap";

// Port defined
// TODO: add to config.
const PORT = 8080;

// Server creation
let server = express();
let tssServer = new tss.Tsserver();


// This sets up a virtual path from '/' to the static directory.
// Adapted from https://expressjs.com/en/starter/static-files.html
// If this middleware fails, it will fall through to the next handler.
// We don't know where our app will be located. Hence the path.join
server.use('/', express.static(path.join(__dirname, '..', 'static')));


/**
 * This can be called to get the first file that the user initiated the server on.
 */
server.get('/api/init', (req: express.Request, res: express.Response) => {
    res.status(200).send(global.rootFile);
});


/**
 * getTextIdentifierTokensLocations returns the text in a specific file, with token information.
 * 
 * @return token Array<{ text: string, type: string, start: {line: number, offset: number} } }>
 */
server.get('/api/getTextIdentifierTokensLocations', (req: express.Request, res: express.Response) => {
    winston.log('info', `Query for getTextIdentifierTokensLocations: ${req.query["filePath"]}`);
    if (req.query.hasOwnProperty('filePath')) {
        tss.scanFileForIdentifierTokens(req.query["filePath"])
            .then(tokenList => {
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(JSON.stringify(tokenList));
            })
            .catch(err => {
                winston.log('error', `getTextIdentifierTokensLocations failed with ${err}`);
                res.status(500).send('Unable to text IdentifierTokensLocations!');
            });
    } else {
        winston.log('error', `no filePath given in request`, req);
        res.status(400).send('Malformed client input.');
    }
});











server.listen(PORT, (err) => {
    if (err) {
        return console.log(`Error starting server: ${err}`);
    }
    console.log(`Server started and listening on port: ${PORT}`);
});
