/**
 * Mocking the global dependencies of the node app.
 * TODO: make sure this path reflects the root of the directory we are trying to traverse.
 * Answer here: http://stackoverflow.com/a/18721515
 */
var path = require("path");
global.appRoot = path.resolve(__dirname);

// Server testing
require("./lib/server");