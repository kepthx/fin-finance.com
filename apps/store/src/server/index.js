/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

require('./error');
global.Promise = require('bluebird');
Promise.config({
	warnings: false
});



// const fs = require('fs');
//
// let hostsCotnent = fs.readFileSync('/etc/hosts', 'utf-8');
// console.log(hostsCotnent);



const config = require('config');
const app = require('./koa');
const {resolve} = require('path');
const {readFileSync} = require('fs');

let http2Opts= Object.assign({}, config.get('http2.options'));

http2Opts.key = readFileSync(resolve(http2Opts.key));
http2Opts.cert = readFileSync(resolve(http2Opts.cert));


const httpServer = config.get('http2.enable')
	? require('spdy').createServer(http2Opts, app.callback())
	: require('http').createServer(app.callback());

// const websocketServer = require('./ws')(httpServer);
require('./ws')(httpServer);

const logger = require('./logger')('server');

// httpServer.listen(config.http.port, config.http.hostname, function () {
httpServer.listen(config.http.port, function () {

	let currentServerAddress = this.address();
	let hostName = currentServerAddress.address == '::'
		? 'localhost'
		: currentServerAddress.address;

	logger.info('Server start at address: http://%s:%s/, in %s mode.', hostName, currentServerAddress.port, process.env.NODE_ENV);
});
