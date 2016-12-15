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
import * as jsonUtil from './util/jsonUtil';

// Server creation
let server = express();
let tssServer = new tss.Tsserver();

// Loads the project into tsserver.
setTimeout(() => {
    tssServer.open(global.rootFile, (err, res) => {
        if (err) {
            throw err;
        }
        console.log('OPENED FILE');
    })
}, 0)

// This sets up a virtual path from '/' to the static directory. Adapted from
// https://expressjs.com/en/starter/static-files.html If this middleware fails,
// it will fall through to the next handler. We don't know where our app will be
// located. Hence the path.join
server.use('/', express.static(path.join(__dirname, '..', 'static')));

/**
 * This can be called to get the first file that the user initiated the server on.
 */
server.get('/api/init', (req : express.Request, res : express.Response) => {
    winston.log('trace', `Responding to /api/init`, global.rootFile);

    res.setHeader('Content-Type', 'application/json');
    res
        .status(200)
        .send(jsonUtil.stringifyEscape(global.rootFile));
});

/**
 * Loads in plain text of the file.
 */
server.get('/api/getFileText', (req : express.Request, res : express.Response) => {
    winston.log('data', `Query for getFileText from url: ${req.url}`);

    let filePath : string;

    /** If filePath exists then lookup that files text. */
    if (req.query.hasOwnProperty('filePath')) {
        filePath = req.query["filePath"]
    } else {
        res
            .status(400)
            .send('Malformed client info');
        return
    }

    // Grab file text
    fs
        .readFile(filePath, 'utf8', function (err, data) {
            if (err) {
                winston.log('error', `Default getFileText failed with ${err}`);
                res
                    .status(500)
                    .send('Unable to get root file text!');
            }

            let fileTextResponse = {
                file: filePath,
                text: data
            }

            res
                .status(200)
                .send(jsonUtil.stringifyEscape(fileTextResponse));
        });

});

/**
 * getTextIdentifierTokensLocations returns the text in a specific file, with token information.
 *
 * @return token Array<{ text: string, type: string, start: {line: number, offset: number} } }>
 */
server.get('/api/getTextIdentifierTokensLocations', (req : express.Request, res : express.Response) => {
    winston.log('info', `Query for getTextIdentifierTokensLocations: ${req.query["filePath"]}`);
    if (req.query.hasOwnProperty('filePath')) {
        tss
            .scanFileForIdentifierTokens(req.query["filePath"])
            .then(tokenList => {
                res.setHeader('Content-Type', 'application/json');
                res
                    .status(200)
                    .send(jsonUtil.stringifyEscape(tokenList));
            })
            .catch(err => {
                winston.log('error', `getTextIdentifierTokensLocations failed with ${err}`);
                res
                    .status(500)
                    .send('Unable to text IdentifierTokensLocations!');
            });
    } else {
        winston.log('error', `no filePath given in request`, req);
        res
            .status(400)
            .send('Malformed client input.');
    }
});

export let SERVER = server;