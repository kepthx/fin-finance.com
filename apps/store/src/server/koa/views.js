/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

const config = require('config');
const views = require('koa-views');
const path = require('path');
// const logger = require('../logger')('koa/views');

module.exports = koaApp => {
	let viewsPath = path.resolve('./src/views');
	let middleware = views(viewsPath, config.get('views'));

	koaApp.use(function* (next) {

		let {layout} = this.query;
		let layouts = ['simple'];
		this.state.layout = layouts.indexOf(layout) >= 0 ? layout : 'default';

		yield next;
	});

	koaApp.use(middleware);
};
