'use strict';



/**
 * Module dependencies.
 */
const SessionManager = require('../SessionManager');

// const MemoryStore = require('./memory_store');


// const parse = require('parseurl');
// const Store = require('./store');
// const copy = require('copy-to');

// const addCommonAPI = require('./commonAPI');
// const {compatMaxage, hash, sessionIdStoreFactory, generateSessionFactory } = require('./sessionIdStore');


/**
 * Warning message for `MemoryStore` usage in production.
 */

// const warning = 'Warning: koa-generic-session\'s MemoryStore is not\n' +
//   'designed for a production environment, as it will leak\n' +
//   'memory, and will not scale past a single process.';






/**
 * setup session store with the given `options`
 * @param {Object} options
 *   - [`key`] cookie name, defaulting to `koa.sid`
 *   - [`store`] session store instance, default to MemoryStore
 *   - [`ttl`] store ttl in `ms`, default to oneday
 *   - [`prefix`] session prefix for store, defaulting to `koa:sess:`
 *   - [`cookie`] session cookie settings, defaulting to
 *     {path: '/', httpOnly: true, maxAge: null, rewrite: true, signed: true}
 *   - [`defer`] defer get session,
 *   - [`rolling`]  rolling session, always reset the cookie and sessions, default is false
 *     you should `yield this.session` to get the session if defer is true, default is false
 *   - [`genSid`] you can use your own generator for sid
 *   - [`errorHanlder`] handler for session store get or set error
 *   - [`valid`] valid(ctx, session), valid session value before use it
 *   - [`beforeSave`] beforeSave(ctx, session), hook before save session
 *   - [`sessionIdStore`] object with get, set, reset methods for passing session id throw requests.
 */
module.exports = function (options) {

	SessionManager.config(options);
	return function * (next) {
		yield * SessionManager.instance.sync(this, next);
	}
};
