"use strict";
var winston = require("winston");
/**
 * Controls the logging for the application.
 *
 * This modifies the default winston logger which the app then uses.
 */
winston.setLevels({
    trace: 0,
    input: 1,
    verbose: 2,
    prompt: 3,
    debug: 4,
    info: 5,
    data: 6,
    help: 7,
    warn: 8,
    error: 9
});
winston.addColors({
    trace: 'magenta',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    debug: 'blue',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    error: 'red'
});
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    level: 'info',
    prettyPrint: true,
    colorize: true,
    silent: false,
    timestamp: false
});
module.exports = winston;
