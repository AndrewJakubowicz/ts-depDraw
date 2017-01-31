/**
 * Author: Andrew Jakubowicz
 *
 * My first attempt to put together a nodejs server.
 *
 *
 *
 * API:
 *
 * /api/getFileText
 *  - returns plain text of the file.
 *  - default: returns text from initiated file.
 *
 * 
 * /api/getTokenType (filePath, line, offset)
 *  - returns data for the type of token requested.
 * 
 * 
 * /api/getTokenDependencies (filePath, line, offset)
 *  - returns the dependencies.
 * 
 * 
 * /api/getTokenDependents (filePath, line, offset)
 *  - returns the dependents.
 * 
 */

import * as http from 'http';
import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';

import * as winston from "./appLogger";
import * as tss from "./tsserverWrap";
import * as jsonUtil from './util/jsonUtil';

import factoryExtractTokensFromFile from './util/factoryExtractTokensFromFile';
const extractTokensFromFile = factoryExtractTokensFromFile({winston});





// Server creation
let server = express();
let tssServer = new tss.TsserverWrapper();

// Check globals
global.tsconfigRootDir = global.tsconfigRootDir || (() => {throw new Error('tsconfigRootDir not set')})();
global.rootFile = global.rootFile || (() => {throw new Error('rootFile not set')})();


// languageHost.getEncodedSemanticClassifications()



/**
 * Set up api endpoints
 */
import factoryGetFileText from './factoryGetFileText';
import factoryGetTokenType from './factoryGetTokenType';
import factoryGetTokenDependencies from './factoryGetTokenDependencies';
import factoryGetTokenDependents from './factoryGetTokenDependents';
const getFileText = factoryGetFileText({tssServer, winston, readFile: fs.readFile});
const getTokenType = factoryGetTokenType({
    tssServer,
    winston
});
const getTokenDependencies = factoryGetTokenDependencies({
    tssServer, winston,
    relative_path: path.relative,
    scanFileForIdentifierTokens: tss.scanFileForIdentifierTokens,
    extractTokensFromFile
});
const getTokenDependents = factoryGetTokenDependents({
    tssServer,
    winston,
    relative_path: path.relative,
    scanFileForIdentifierTokens: tss.scanFileForIdentifierTokens,
    extractTokensFromFile
})







// Loads the project into tsserver.
setTimeout(() => {
    tssServer.open(global.rootFile)
        .then(() => { winston.log('trace', `Opened file:`, global.rootFile); })
        .catch(err => { throw err });
}, 1);

// This sets up a virtual path from '/' to the static directory. Adapted from
// https://expressjs.com/en/starter/static-files.html If this middleware fails,
// it will fall through to the next handler. We don't know where our app will be
// located. Hence the path.join
server.use('/', express.static(path.join(__dirname, '..', 'static')));

// This should allow CORS on the server.
// Thank you: http://enable-cors.org/server_expressjs.html
server.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


/**
 * Loads in plain text of the file.
 * 
 *  If there is no filePath sent then it opens the initiated file.
 */
server.get('/api/getFileText', (req : express.Request, res : express.Response) => {
    winston.log('data', `Query for getFileText from url: ${req.url}`);

    let filePath : string;

    /** If filePath exists then lookup that files text. */
    if (req.query.hasOwnProperty('filePath')) {
        filePath = req.query["filePath"]
    } else {
        filePath = global.rootFile;
    }
    
    getFileText(filePath)
        .then(stringResponse => {
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(stringResponse)
        })
        .catch(res.status(500).send)

});


/**
 * getTokenType returns the type of a specific token.
 * 
 * Requires filePath {string}, line {number}, offset {number}.
 */
server.get('/api/getTokenType', (req: express.Request, res: express.Response) => {
    winston.log('info', `Query for getTokenType:`, req.query);
    
    if (sanitiseFileLineOffset(req, res) !== true){
        return
    }

    let filePath = req.query['filePath'],
        line = parseInt(req.query['line']),
        offset = parseInt(req.query['offset']);
    
    getTokenType(filePath, line, offset)
        .then(stringResponse => {
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(stringResponse)
        })
        .catch(res.status(500).send)
});


/**
 * getTokenDependencies returns the dependencies of a specified token.
 */
server.get('/api/getTokenDependencies', (req: express.Request, res: express.Response) => {
    winston.log('info', `Query for getTokenDependencies:`, req.query);

    if (sanitiseFileLineOffset(req, res) !== true){
        return
    }
    let filePath = req.query['filePath'],
        line = parseInt(req.query['line']),
        offset = parseInt(req.query['offset']);
    
    getTokenDependencies(filePath, line, offset)
        .then(stringResponse => {
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(stringResponse)
        })
        .catch(res.status(500).send)
    
});

/**
 * getTokenDependents returns the dependents of a specified token.
 * 
 */
server.get('/api/getTokenDependents', (req: express.Request, res: express.Response) => {
    winston.log('info', `Query for getTokenDependents:`, req.query);

    if (sanitiseFileLineOffset(req, res) !== true){
        return
    }
    let filePath = req.query['filePath'],
        line = parseInt(req.query['line']),
        offset = parseInt(req.query['offset']);
    
    getTokenDependents(filePath, line, offset)
        .then(dependents => {
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(dependents);
        })
        .catch(res.status(500).send);
});

/**
 * Helper function for making sure that query contains filePath, line and offset properties.
 */
function sanitiseFileLineOffset(req: express.Request, res: express.Response){
    if (!(req.query.hasOwnProperty('filePath') && req.query.hasOwnProperty('line') && req.query.hasOwnProperty('offset'))) {
        winston.log('error', `need filePath && line && offset given in request`, req.query);

        return res.status(400).send('Malformed client input.');
    }

    if (isNaN(parseInt(req.query['line'])) || isNaN(parseInt(req.query['offset']))){
        winston.log('error', `Line and offset must be numbers!`);
        return res.status(400).send('Malformed client input.');
    }
    return true;
}




export let SERVER = server;