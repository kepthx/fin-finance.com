/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

const logger = require('../logger')('error');

/**
 * Caught unhandled rejections
 *
 * []{@link https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V6.md#notable-changes}
 */
process.on('warning', err => logger.error(err));

process.on('unhandledRejection', (reason, p) => {
	logger.warn('Unhandled Rejection at: Promise %j, reason %s', p, reason);
	// application specific logging, throwing an error, or other logic here'
});
