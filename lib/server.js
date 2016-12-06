/**
 * Author: Andrew Jakubowicz
 *
 * My first attempt to put together a nodejs server.
 *
 */
"use strict";
var express = require('express');
var fs = require('fs');
var path = require("path");
var winston = require("./appLogger");
var tss = require("./tsserverWrap");
var config = require("../config.json");
// Port defined
// TODO: add to config.
var PORT = 8080;
// Server creation
var server = express(); // Http server
var tssServer = new tss.Tsserver(); // Typescript server
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
server.get('/api/getFileText', function (req, res) {
    winston.log('info', "Query for getFileText from " + req.ip);
    var fileTextResponse;
    /** If filePath exists then lookup that files text. */
    if (req.query.hasOwnProperty('filePath')) {
        fileTextResponse = {
            file: req.query["filePath"],
            text: "Example Text so far!"
        };
        res.status(200).send(JSON.stringify(fileTextResponse));
    }
    else {
        // Optimistically assume they want root text.
        fs.readFile(config.rootFile, 'utf8', function (err, data) {
            if (err) {
                winston.log('error', "Default getFileText failed with " + err);
                res.status(500).send('Unable to get root file text!');
            }
            fileTextResponse = {
                file: config.rootFile,
                text: data
            };
            res.status(200).send(JSON.stringify(fileTextResponse));
        });
    }
});
/**
 * getFileTextMetaData returns the text in a specific file, with token information.
 */
server.get('/api/getFileTextMetadata', function (req, res) {
    winston.log('info', "Query for getFileTextMetaData");
    if (req.query.hasOwnProperty('filePath')) {
        tssServer.scanFileForAllTokens(req.query["filePath"], function (err, response) {
            if (err) {
                winston.log('error', "scanFileForAllTokens failed with: " + err);
                res.status(500).send('Internal Server Problem');
                return;
            }
            console.log(response);
            res.status(200).send(response);
        });
    }
    else {
        res.status(400).send('Malformed user input');
    }
});
global.appRoot = path.resolve(__dirname);
server.listen(PORT, function (err) {
    if (err) {
        return console.log("Error starting server: " + err);
    }
    console.log("Server started and listening on port: " + PORT);
});
