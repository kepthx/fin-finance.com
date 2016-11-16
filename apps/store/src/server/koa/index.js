/**
 * @overview Configure koa application
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

const config = require('config');
const koa = require('koa');
const koaApp = koa();
const onerror = require('koa-onerror');
const rt = require('koa-rt');
const qs = require('qs');
const logger = require('../logger')('server/koa');


koaApp.name = config.get('app.name');
koaApp.proxy = config.get('app.proxy');
koaApp.keys = config.get('http.keys');
// require('./webpack-hot')(koaApp); is broken
onerror(koaApp);

require('./static')(koaApp);
koaApp.use(rt());

koaApp.use(function * (next) {

	this.state['cookiesEnabled'] = this.cookies.get('cookiesSettings');
	this.query = qs.parse(this.querystring);

	this.state.link = {
		url: this.url,
		query: this.query,
		origin: this.origin
	};

	yield next;

});


koaApp.use(function* (next) {
	// console.log('\n-------------------------------  START %s %s  ---------------------------------------\n', this.path, this.method);
	var start = new Date;
	yield next;
	var ms = new Date - start;
    // this.set('X-Response-Time', ms + 'ms');
	logger.info('-------------------------------  END %s %s %s ms   ---------------------------------------\n', this.path, this.method, ms);
});


// const passport = require('koa-passport');
const bodyParser = require('koa-bodyparser');
const session = require('../../libs/session');
const redisStore = require('koa-redis')(config.get('redis-cache'));

koaApp.use(bodyParser());
let sessionConfig = Object.assign({}, {
	store: redisStore,
	// beforeSave : function (ctx, session) {
	// 	console.log("BEFORE SAVE", Object.keys(session));
	// }
	// sessionIdStore
}, config.get('session'));

koaApp.use(session(sessionConfig));
require('../auth')(koaApp);
require('./i18n')(koaApp);
require('./views')(koaApp);
require('./common')(koaApp);
require('./basket')(koaApp);
require('../router')(koaApp);
require('./notFoundPage')(koaApp);


module.exports = koaApp;
