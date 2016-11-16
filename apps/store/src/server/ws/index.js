/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';


const config = require('config');
const Primus = require('primus.io');
const logger = require('../logger')('ws');
const fs = require('fs');
const path = require('path');
const wrapController = require('./rpc');
const Cookies = require('cookies');


/**
 * Singleton websocket server
 * @type { primus.Primus }
 */
let websocketServer = null;
/**
 * Configure websocket server
 *
 * @param  {http.Server} httpServer Nodejs core http server
 * @param  {Object} [options={}]  Primusio config {@link https://github.com/primus/primus}
 * @return {primus.Primus} PrimusIo instance
 */
let configureWebsocket = (httpServer, options = {}) => {
	let websocketServer = new Primus(httpServer, options);
	fs.writeFileSync(path.resolve('./src/client/libs/ws', 'index.js'), websocketServer.library()); //TODO move to webpack builder
	// let clientLogger = websocketServer.channel('client.logger.stream');



	websocketServer.use('session', function (req, res, next) {

		let test = 'azazaz';
		// logger.info(req.headers.cookie);

		// 
		// let cookies = new Cookies(req, res, {
		// 	// keys: this.keys,
		// 	// secure: request.secure
		// });
		//
		// console.log(cookies);

		req.session = {
			test
		};

		next();
	});



	websocketServer.on('connection', function (spark) {
		logger.info('Spark connected', spark.query, spark.request.session);

			// console.log(spark.request.session);

			spark.on('hi', function () {
				// console.log('hi');
				// console.log(Object.keys(this.request), this.request.rawHeaders);
			});


			//
			// spark.on('hi', function () {
			// })

	});

	websocketServer.on('disconnection', function (spark) {
		logger.info('Spark disconnected', spark.query, spark.session);
	});


	websocketServer.on('connection', wrapController);
	return websocketServer;
};

/**
 * Initialize and return websocket server
 *
 * @param  {http.Server} httpServer Nodejs core http server
 * @return {primus.Primus} PrimusIo instance
 */
let initialize = (httpServer = null) =>  websocketServer
	? websocketServer
	: (websocketServer = configureWebsocket(httpServer, config.get('websocket')));


module.exports = initialize;
