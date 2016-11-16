/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

const config = require('config');
const serve = require('koa-static');
const mount = require('koa-mount');


module.exports = koaApp => {
	config.get('static').forEach(staticPath => koaApp.use(serve(staticPath)));
	koaApp.use(mount('/build', serve('./build')));
};
