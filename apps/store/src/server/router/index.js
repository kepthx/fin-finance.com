/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

const router = require('koa-router')();
const Boom = require('boom');
const config = require('config');

// router.use(function* (next) {
//
// 	// this.session.debug();
// 	yield next;
// });

require('./home')(router);
require('./cart')(router);
require('./mailer')(router);
require('./Auth')(router);
require('./Account')(router);
require('./documents')(router);
// require('./debug')(router);
require('./contacts')(router);
require('./content')(router);
require('./dashboard')(router);


const redis = require('redis');
const redisClient = redis.createClient({host: 'redis'});

let mount = koaApp => {

	koaApp.use(function* routerHelpers(next) {
		this.state.page_class = 'sub-page';
		this.state.helpers.url = (...args) => router.url(...args);

		yield next;
	});


	//EXPEREMENTAL PAGE CACHE
	let cachedPath = ['/', '/content/license/payment-service-provider.html'];
	koaApp.use(function* cacheMiddleware(next) {

		if (!config.has('experemental.cache.enable') || !config.get('experemental.cache.enable')) {
			return yield next;
		}

		let pathCanBeCached = cachedPath.includes(this.url);
		if (pathCanBeCached) {
			let getPageBodyPromise = new Promise((resolve, reject) =>
				redisClient.get('page ' + this.url,  (err, reply) => err ? reject(err) : resolve(reply))
			);

			let currentBody = yield getPageBodyPromise;

			if (currentBody !== null) {
				this.body = currentBody;
				return;
			}
		}

		yield next;

		if (pathCanBeCached) {
			let saveBodyPromise = new Promise((resolve, reject) =>
				redisClient.set('page ' + this.url, this.body, (err, reply) => err ? reject(err) : resolve(reply))
			);
			yield saveBodyPromise;
		}
	});


	koaApp.use(router.routes());
	koaApp.use(router.allowedMethods({
		throw: true,
		notImplemented: () => new Boom.notImplemented(),
		methodNotAllowed: () => new Boom.methodNotAllowed()
	}));
};


module.exports = mount;
