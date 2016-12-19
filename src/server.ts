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
 * /api/getTokenType (filePath, line, offset)
 *  - returns data for the type of token requested.
 * 
 * 
 * /api/getTokenDependencies (filePath, line, offset)
 *  - returns the dependencies.
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
        winston.log('trace', `Opened file:`, global.rootFile);
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
    return res.status(200).send(jsonUtil.stringifyEscape(global.rootFile));
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
        return res.status(400)
                  .send('Malformed client info');
    }

    // Initiate tssServer open callback.
    tssServer.open(filePath, err => {
        if (err) {
            winston.log('error', `open method failed`, err);
            return res.status(500).send('Server failed to open file.');
        }
    });

    // Grab file text
    fs
        .readFile(filePath, 'utf8', function (err, data) {
            if (err) {
                winston.log('error', `getFileText failed with ${err}`);
                return res.status(500)
                          .send('Unable to get root file text!');
            }

            let fileTextResponse = {
                file: filePath,
                text: data
            }

            return res.status(200)
                      .send(jsonUtil.stringifyEscape(fileTextResponse));
        });

});

/**
 * getTextIdentifierTokensLocations returns the text in a specific file, with token information.
 *
 * @return token Array<{ text: string, type: string, start: {line: number, offset: number} } }>
 */
server.get('/api/getTextIdentifierTokensLocations', (req : express.Request, res : express.Response) => {
    winston.log('info', `Query for getTextIdentifierTokensLocations:`, req.query);
    if (req.query.hasOwnProperty('filePath')) {
        tss
            .scanFileForIdentifierTokens(req.query["filePath"])
            .then(tokenList => {
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).send(jsonUtil.stringifyEscape(tokenList));
            })
            .catch(err => {
                winston.log('error', `getTextIdentifierTokensLocations failed with ${err}`);
                return res.status(500).send('Unable to text IdentifierTokensLocations!');
            });
    } else {
        winston.log('error', `no filePath given in request`, req);
        return res.status(400).send('Malformed client input.');
    }
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
    
    tssServer.open(filePath, err => {
        if (err) {
            winston.log('error', `Couldn't open file`, err);
            return res.status(500).send('Internal error');
        }
    });

    tssServer.quickinfo(filePath, line, offset, (err, response, request) => {
        winston.log('trace', `Response of type`, response);
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(jsonUtil.stringifyEscape(jsonUtil.parseEscaped(response)));
    });
});


/**
 * getTokenDependencies returns the dependencies of a specified token.
 * 
 * Finds definition of token, and then filters the tokens from the definition filePath
 * to only include the tokens which are Indentifiers and within the start and end range.
 */
server.get('/api/getTokenDependencies', (req: express.Request, res: express.Response) => {
    winston.log('info', `Query for getTokenDependencies:`, req.query);

    let errFunc = (err) => {
        winston.log('error', `Error occurred in getTokenDependencies`, err);
        return res.status(500).send('Internal Server Error');
    }

    if (sanitiseFileLineOffset(req, res) !== true){
        return
    }
    let filePath = req.query['filePath'],
        line = parseInt(req.query['line']),
        offset = parseInt(req.query['offset']);

    let definitionToken;
    let definitionFilePath: string;
    let definitionLocation = new Promise((resolve, reject) => {
        tssServer.definition(filePath, line, offset, (err, response) => {
            if (err) {
                reject(err);
            }
            resolve(response);
        });
    }).then((response: string) => {
        return jsonUtil.parseEscaped(response)
    }, errFunc)
    .then(resp => {
        if (!resp.success){
            throw new Error(`Cannot find definition: '${resp}'`);
        }
        definitionToken = resp;
        definitionFilePath = resp.body[0].file

        return tss.scanFileForIdentifierTokens(path.relative(global.tsconfigRootDir, definitionFilePath));
    }).then(allFileTokens => {
        let tokenDefinition = definitionToken
        winston.log('trace', `Slicing dependencies using`, definitionToken, allFileTokens);

        return extractTokensFromFile(allFileTokens,
                                        tokenDefinition.body[0].start,
                                        tokenDefinition.body[0].end);
        
    }, err => {
        winston.log('error', `Error selectedDependencies`, err);
        throw err;
    })
    .then(selectTokens => {
        // This is where we filter by token type.
        return selectTokens.filter(token => {
            return token.type === 'Identifier';
        });
    }).then(selectedTokens => {
        // Here we are adding metadata.
        let quickInfoList = [];
        (selectedTokens as any[]).forEach(token => {
            quickInfoList.push(new Promise((resolve, reject) => {
                tssServer.quickinfo(definitionFilePath, token.start.line, token.start.character, (err, resp) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(jsonUtil.parseEscaped(resp))
                });
            }));
        });
        return Promise.all(quickInfoList);
    }).then(args => {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(jsonUtil.stringifyEscape(args));
    })
    .catch(errFunc)
});


/**
 * Helper function for making sure that 
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

/**
 * Helper function that binary searches a file list.
 */
function extractTokensFromFile(fileTokenList, start, end){
    winston.log('trace', `extractTokensFromFile called with`, arguments);


    // TODO: optimise with binary search.
    return fileTokenList.filter(token => {
        if (token.start.line === start.line) {
            return token.start.character > start.offset
        }
        if (token.start.line === end.line) {
            return token.start.character < end.offset
        }
        return (token.start.line >= start.line && token.start.line <= end.line)
    });
}



export let SERVER = server;