/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

/**
 * @file Application logger
 *
 * Pino (perfomance, same config) https://github.com/mcollina/pino or
 * Bunyan https://github.com/trentm/node-bunyan
 */

const config = require('config');
const { assign } = require('lodash');
// const stream = require('stream');


let outStream = process.stdout;
outStream.isTTY = true;

const streams = [
	{
		stream : outStream
	}
];



/**
 * Logger configuration
 * @type {Object}
 */
let loggerConfig = assign({}, config.get('logger'), { streams });

/**
 * Singleton instance of logger
 * @type {bunyan.Logger}
 */
let logger = require('bunyan').createLogger(loggerConfig);
// let logger = require('pino')(loggerConfig);


/**
 * Logger factory - create child logger
 * @param {String} from From part id
 * @return  Logger
 */
module.exports = from => {
	return logger.child({ from });
};
