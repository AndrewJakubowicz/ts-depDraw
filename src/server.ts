/**
 * Author: Andrew Jakubowicz
 * 
 * My first attempt to put together a nodejs server.
 * 
 */

import * as http from 'http';
import * as express from 'express';
import * as fs from 'fs';

import * as winston from "./appLogger";
import * as tss from "./tsserverWrap";

let config = require("../config.json");

// Port defined
// TODO: add to config.
const PORT = 8080;

// Server creation
let server = express();
let tssServer = new tss.Tsserver();

// This sets up a virtual path from '/' to the static directory.
// Adapted from https://expressjs.com/en/starter/static-files.html
// If this middleware fails, it will fall through to the next handler.
server.use('/', express.static('static'));

/**
 * This is the api used to load the code files into the browser.
 * 
 * Default:
 *  If there is no fileName supplied, the api responds with the config.rootFile
 *  filePath.
 * 
 * This cannot just return plain text. This returns a list of all the text.
 * This text is lumped with an object.
 * Each token has this shape:
 *      - tokenText
 *      - tokenType
 *      - start
 *          - line and offset
 *      - end
 *          - line and offset
 *      - isDefinition
 */
server.get('/api/getFileText', (req: express.Request, res: express.Response) => {
    winston.log('data', `Query for getFileText from url: ${req.url}`);

    let fileTextResponse: GetFileText;

    /** If filePath exists then lookup that files text. */
    if (req.query.hasOwnProperty('filePath')){
        fileTextResponse = {
            file: req.query["filePath"],
            text: "Example Text so far!"
        }

        res.status(200).send(JSON.stringify(fileTextResponse));

    } else {
        // Optimistically assume they want root text.
        fs.readFile(config.rootFile, 'utf8', function(err, data){
            if (err) {
                winston.log('error', `Default getFileText failed with ${err}`);
                res.status(500).send('Unable to get root file text!');
            }
            
            fileTextResponse = {
                file: config.rootFile,
                text: data
            }

            res.status(200).send(JSON.stringify(fileTextResponse));
        });


/**
 * getFileTextMetaData returns the text in a specific file, with token information.
 */
server.get('/api/getFileTextMetadata', (req: express.Request, res: express.Response) => {
    winston.log('info', `Query for getFileTextMetaData`);
    if (req.query.hasOwnProperty('filePath')){
        tssServer.scanFileForAllTokens(req.query["filePath"], (err, response) => {
            if (err) {
                winston.log('error', `scanFileForAllTokens failed with: ${err}`);
                res.status(500).send('Internal Server Problem');
                return
            }
            let newResponse = tss.combineRequestReturn(response);
            
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(JSON.stringify(newResponse));
        })
    } else {
        res.status(400).send('Malformed user input');
    }
});

server.listen(PORT, (err) => {
    if (err) {
        return console.log(`Error starting server: ${err}`);
    }
    console.log(`Server started and listening on port: ${PORT}`);
});



/**
 * These interfaces are a quick way to lookup what the various api methods respond with.
 */

/** Response json of getFileText handler */
interface GetFileText {
    file: string,
    text: string
}