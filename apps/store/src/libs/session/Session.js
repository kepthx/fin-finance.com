'use strict';

const Settings = require('./Settings');
const _ = require('lodash');

class Session {

	constructor (options) {

		let {cookie} = Settings.get();

		this.__sessionId = null;
		this.__defaultSessionData = {cookie};
		this.__isDestroyed = false;

		// this.__websockets = [];
		this.__isChanged = false;
		this.__data = _.cloneDeep(this.__defaultSessionData);

		this.__dataProxy = null;
		this.defineProxy(this.__data);
	}

	defineProxy (initData) {

		this.__dataProxy = null;
		this.__dataProxy = new Proxy(initData, {

			deleteProperty : (target, name) => {

				if (['id', 'cookie'].indexOf(name) >= 0) return true;

				delete target[name];
				delete this.__data[name];
				this.__isChanged = true;

				return true;
			},

			has : (target, name) => {
				return name in target || name in this.__data;
			},

			get :  (target, name, reciever) =>  {

				let result = undefined;

				switch (name) {
				case 'id': result = this.__sessionId; break;
				case 'destroy': result = this.destroy.bind(this); break;
				case 'save': result = this.save.bind(this, true); break;
				case 'debug': result = this.debug.bind(this); break;
				default: result = name in this.__data
					? this.__data[name]
					: undefined;
				}

				return result;
			},

			set :  (target, prop, value) => {

				switch (true) {
				case ['cookie', 'id'].indexOf(prop) >= 0:  break;
				default:
					this.__isChanged = true;

					value = JSON.stringify(value);
					value = JSON.parse(value);

					this.__data[prop] = value;
					target[prop] = value;
				}

				return true;
			}
		});
	}

	debug() {
		console.log('%s %s %s',__filename, ':66', JSON.stringify(this.__data));
	}

	get isChanged () {
		return this.__isChanged;
	}

	get isDestroyed () {
		return this.__isDestroyed;
	}

	get data() {
		return this.__dataProxy;
	}

	* destroy() {

		let {store} = Settings.get();
		yield * store.destroy(this.__sessionId);

		this.__sessionId = null;
		this.__data = {};

		this.__isDestroyed = true;
	}

	* save (saveAnyway = false) {

		let {store} = Settings.get();
		if (this.isChanged || saveAnyway) {
			let result = yield * store.set(this.__sessionId, this.__data);
		}

		this.__isChanged = false;
	}

	* load (sessionId) {

		let {store} = Settings.get();
		this.__sessionId = sessionId;

		let data = yield * store.get(sessionId);
		if (data) {
			this.__data = data;
			this.defineProxy(data);
		}
	}

	* loadFromCtx (ctx) {

		let {key: cookiesKey, cookie, allowEmpty, genSid, rolling} = Settings.get();
		cookie = cookie || {};
		this.__sessionId = ctx.cookies.get(cookiesKey, cookie);

		if (rolling && this.__sessionId) {
			yield * this.destroy();
		}

		if (!this.__sessionId) {

			this.__sessionId = yield genSid(14);
			if (!allowEmpty) {
				this.__saveSidToCookies(ctx);
				yield * this.save(true);
			}

			return ;
		}

		yield * this.load(this.__sessionId);
	}

	__saveSidToCookies (ctx) {

		let {key: cookiesKey, cookie} = Settings.get();
		ctx.cookies.set(cookiesKey, this.__sessionId, cookie);
	}

	* sync(ctx, next) {


		let {key: cookiesKey} = Settings.get();
		let error;
		let sessionId = yield * this.loadFromCtx(ctx);

		Object.defineProperty(ctx, 'session', {
			get : () => this.data
		});

		let me = this;
		ctx.regenerateSession = function *  (){
			yield me.destroy();
		}

		try { yield next; } catch (e) { error = e; }

		if (this.isDestroyed) {
			ctx.cookies.set(cookiesKey);
		} else if (this.isChanged) {
			this.__saveSidToCookies(ctx);
			yield * this.save();
		}

		if (error) {
			throw error;
		}
	}
}

module.exports = Session;
