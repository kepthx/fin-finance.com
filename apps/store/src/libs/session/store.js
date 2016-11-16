/**!
 * koa-generic-session - lib/store.js
 * Copyright(c) 2014
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

// const util = require('util');
const {EventEmitter} = require('events');
const debug = require('debug')('koa-generic-session:store');
// const copy = require('copy-to');

const defaultOptions = {
	prefix: 'koa:sess:'
};


class Store extends EventEmitter{

	constructor(client, options = defaultOptions) {
		super();
		this.client = client;
		this.options = Object.assign({}, defaultOptions,  options);
		if (typeof client.on === 'function') {
			client.on('disconnect', this.emit.bind(this, 'disconnect'));
			client.on('connect', this.emit.bind(this, 'connect'));
		}
	}

	* get (sid) {
		sid = this.options.prefix + sid;
		debug('GET %s', sid);

		let data = yield this.client.get(sid);
		if (!data) {
			debug('GET empty');
			return null;
		}

		if (data && data.cookie && typeof data.cookie.expires === 'string') {
			// make sure data.cookie.expires is a Date
			data.cookie.expires = new Date(data.cookie.expires);
		}

		debug('GOT %j', data);
		return data;
	}

	* set (sid, sess) {
		let {ttl} = this.options;
		if (!ttl) {
			let maxage = sess.cookie && sess.cookie.maxage;
			if (typeof maxage === 'number') {
				ttl = maxage;
			}
			// if has cookie.expires, ignore cookie.maxage
			if (sess.cookie && sess.cookie.expires) {
				ttl = Math.ceil(sess.cookie.expires.getTime() - Date.now());
			}
		}

		sid = this.options.prefix + sid;
		debug('SET key: %s, value: %s, ttl: %d', sid, sess, ttl);
		yield this.client.set(sid, sess, ttl);
		debug('SET complete');
	}

	* destroy (sid) {
		  sid = this.options.prefix + sid;
		  debug('DEL %s', sid);
		  yield this.client.destroy(sid);
		  debug('DEL %s complete', sid);
	}
}



// function Store(client, options) {
//   this.client = client;
//   this.options = {};
//   copy(options).and(defaultOptions).to(this.options);
//   EventEmitter.call(this);
//
//   // delegate client connect / disconnect event
//   if (typeof client.on === 'function') {
//     client.on('disconnect', this.emit.bind(this, 'disconnect'));
//     client.on('connect', this.emit.bind(this, 'connect'));
//   }
// }
//
// util.inherits(Store, EventEmitter);
//
// Store.prototype.get = function *(sid) {
//   var data;
//   sid = this.options.prefix + sid;
//   debug('GET %s', sid);
//   data = yield this.client.get(sid);
//   if (!data) {
//     debug('GET empty');
//     return null;
//   }
//   if (data && data.cookie && typeof data.cookie.expires === 'string') {
//     // make sure data.cookie.expires is a Date
//     data.cookie.expires = new Date(data.cookie.expires);
//   }
//   debug('GOT %j', data);
//   return data;
// };
//
// Store.prototype.set = function *(sid, sess) {
//   var ttl = this.options.ttl;
//   if (!ttl) {
//     var maxage = sess.cookie && sess.cookie.maxage;
//     if (typeof maxage === 'number') {
//       ttl = maxage;
//     }
//     // if has cookie.expires, ignore cookie.maxage
//     if (sess.cookie && sess.cookie.expires) {
//       ttl = Math.ceil(sess.cookie.expires.getTime() - Date.now());
//     }
//   }
//
//   sid = this.options.prefix + sid;
//   debug('SET key: %s, value: %s, ttl: %d', sid, sess, ttl);
//   yield this.client.set(sid, sess, ttl);
//   debug('SET complete');
// };
//
// Store.prototype.destroy = function *(sid) {
//   sid = this.options.prefix + sid;
//   debug('DEL %s', sid);
//   yield this.client.destroy(sid);
//   debug('DEL %s complete', sid);
// };

module.exports = Store;
