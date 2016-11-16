/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

const config = require('config');
const thinky = require('thinky')(config.get('database'));

module.exports = thinky;
