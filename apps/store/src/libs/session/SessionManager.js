'use strict';

const _ = require('lodash');

const Session = require('./Session');
const Settings = require('./Settings');


let singleton;
class SessionManager {

	constructor() {

		this.__isReady = false;

		if (singleton) {
			throw new Error('SessionManager already exists, use instance method instead of constructor!')
		}
	}

	static get instance() {

		if (!singleton) {
			singleton = new SessionManager();
		}

		return singleton;
	}

	static get options () {
		return Settings.get();
	}

	static config(options = {}) {
		Settings.extend(options);
	}

	get isInitialized () {

		return new Promise((resolve, reject) => {
			if (this.__isReady) {
				return resolve(this.__isReady)
			}

			resolve(true);
		});
	}

	* destroy (sid) {
		let session = yield * this.load(sid);
		return yield * session.destroy();
	}


	* load (sid) {
		yield this.isInitialized;
		let session = new Session();
		session.load(sid);
		return session;
	}

	* sync (ctx, next) {
		yield this.isInitialized;
		let session = new Session();
		yield session.sync(ctx, next);
	}

	* list (limit = -1) {

	}

	* count () {
		yield this.isInitialized;
		let totalSessions = yield * this.list();
		return totalSessions.length;
	}
}


module.exports = SessionManager;
