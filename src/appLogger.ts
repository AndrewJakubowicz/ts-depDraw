import * as winston from "winston";

/**
 * Controls the logging for the application.
 * 
 * This modifies the default winston logger which the app then uses.
 */


winston.setLevels({
  trace: 9,
  input: 8,
  verbose: 7,
  prompt: 6,
  debug: 5,
  info: 4,
  data: 3,
  help: 2,
  warn: 1,
  error: 0
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

winston.remove(winston.transports.Console)
winston.add(winston.transports.Console, {
  level: 'trace',
  prettyPrint: true,
  colorize: true,
  silent: false,
  timestamp: false
});

export = winston