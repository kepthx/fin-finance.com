'use strict';

const webpack = require('webpack');
let webpackConfig = require('./webpack.dev.conf');
const config = require('config');
const cssnano = require('cssnano');
let OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');


// const logger = require('../server/logger')('client/webpack.production.conf');

// webpackConfig.output.publicPath = `http://${ config.get('http.hostname') }:${ config.get('http.port') }/build/`;
// webpackConfig.output.publicPath = config.get('webpack.output.publicPath');
webpackConfig.watch = false;
// webpackConfig.plugins = webpackConfig.plugins.reduce((result, plugin, index) => {
//
// 	if (index !== 1) {
// 		result.push(plugin);
// 	}
//
// 	return result;
//
// }, []);

webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
	compress: { warnings: false }
}));

webpackConfig.plugins.push(new OptimizeCssAssetsPlugin({
	// assetNameRegExp: /\.optimize\.css$/g,
	cssProcessor: cssnano,
	cssProcessorOptions: { discardComments: {removeAll: true } },
	canPrint: true
}));


module.exports = webpackConfig;
