'use strict';

const uid = require('uid-safe');
const memoryStore = require('./memoryStore');
const _ = require('lodash');

const defaultCookie = {
	httpOnly: true,
	path: '/',
	overwrite: true,
	signed: true,
	maxAge: 24 * 60 * 60 * 1000 //one day in ms
};

const defaultOptions = {
	key: 'koa.sid',
	prefix: 'koa:sess:',
	ttl: null,
	rolling: false,
	allowEmpty: true,
	// reconnectTimeout: '10s',
	// sessionIdStore: '10s',
	genSid: uid,
	store: new memoryStore(),
	cookie : defaultCookie,
	valid (ctx, session) {  },
	errorHandler (err, type, ctx) {},
	beforeSave (ctx, session) {},
}

let globalSettings = defaultOptions;

module.exports = class Settings {

	static get () {
		return _.cloneDeep(globalSettings);
	}

	static extend (options = {}) {
		globalSettings = _.defaultsDeep(options, globalSettings)
	}
};
