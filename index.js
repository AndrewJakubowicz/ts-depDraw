/**
 * Mocking the global dependencies of the node app.
 * TODO: make sure this path reflects the root of the directory we are trying to traverse.
 * Answer here: http://stackoverflow.com/a/18721515
 */
var path = require("path");
global.appRoot = path.resolve(__dirname);

var winston = require('./lib/appLogger');

// Port defined
// TODO: add to config.
const PORT = 8080;


// Server start and stop: This is basically the whole program.
if (global.startServer) {
    let server = require('./lib/server')
        .SERVER
        .listen(PORT, (err) => {
            if (err) {
                return console.log(`Error starting server: ${err}`);
            }
            console.log(`Server started and listening on port: ${PORT}`);
        })
        // On error close the program, with a helpful error message.
        .on('error', function (err) {
            if (err.message.includes('EADDRINUSE')) {
                winston.log(`error`, `Port: ${PORT} is in use. Please change the port.`);
            }
            winston.log('trace', `Failed to start server with:`, err);
            server.close(function () {
                process.exit(0);
            });
        });
}