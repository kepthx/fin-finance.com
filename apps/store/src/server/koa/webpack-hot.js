/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

const webpack = require('webpack');
const webpackConfig = require('../../client/webpack.dev.conf');
const compiler = webpack(webpackConfig);


const {
	devMiddleware,
	hotMiddleware
} = require('koa-webpack-middleware');


module.exports = koaApp => {


	koaApp.use(devMiddleware(compiler, {
		// display no info to console (only warnings and errors)
		noInfo: false,

		// display nothing to the console
		quiet: false,

		// switch into lazy mode
		// that means no watching, but recompilation on every request
		lazy: true,

		// watch options (only lazy: false)
		watchOptions: {
			aggregateTimeout: 300,
			poll: true
		},

		// public path to bind the middleware to
		// use the same as in webpack
		publicPath: '/assets/',

		// custom headers
		headers: {
			'X-Custom-Header': 'yes'
		},

		// options for formating the statistics
		stats: {
			colors: true
		}
	}));

	koaApp.use(hotMiddleware(compiler));
};
