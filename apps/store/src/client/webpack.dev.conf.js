'use strict';
// let BrowserSyncPlugin = require('browser-sync-webpack-plugin');

const webpack = require('webpack');
const path = require('path');
const bourbonPaths = require('bourbon').includePaths;
const bourbonNeatPaths = require('bourbon-neat').includePaths;

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const extractCSS = new ExtractTextPlugin('style/[name].css');


// const webpack = require('webpack');



// [Documentation sass-loader]{@link https://github.com/jtangelder/sass-loader}
// [Documentation css-loader]{@link https://github.com/webpack/css-loader}

// TODO: https://github.com/webpack/extract-text-webpack-plugin,

let webpackConfig = {

	context: __dirname,
	progress: true,
	entry: {
		front: './front/index.js',
		dashboard: './admin/index.js'
	},
	output: {
		// Make sure to use [name] or [id] in output.filename
		//  when using multiple entry points
		filename: '[name].bundle.js',
		chunkFilename: '[id].bundle.js',
		path: './build',
		// publicPath: 'http://localhost:3031/build/',
		publicPath: '/build/',
	},
	module: {
		loaders: [

			{
				test: /\.js$/,
				exclude: /(alraa|node_modules|bower_components|client\/libs\/ws\/index[.]js)/,
				loader: 'babel', // 'babel-loader' is also a valid name to reference
				query: {
					presets: ['es2015'],
					// plugins: ['syntax-async-functions', 'transform-regenerator']
				}
			},
			// { test: /\.scss$/, loaders: ['style', 'css?sourceMap', 'sass?sourceMap'] },
			// { test: /\.css$/, loader: 'style!css?sourceMap' },
			{ test: /\.pug$/, loader: 'pug'},
			{ test: /\.scss$/, loader: extractCSS.extract(['css?sourceMap','sass?sourceMap']) },
			{ test: /\.css$/, loader: extractCSS.extract(['css?sourceMap']) },
			{ test: /\.(eot|woff|woff2|gif|ttf|svg|png|je?pg)([?].*)?$/, loader: 'file-loader?limit=30000&name=[name]-[hash].[ext]' }
			// { test: /\.png$/, loader: 'url-loader?limit=100000' },
			// { test: /\.jpg$/, loader: 'file-loader' },
			// { test: /\.svg$/, loader: 'file-loader' },
			// { test: /\.(eot|woff|woff2|ttf|svg|png|jpg)([?].*)?$/, loader: 'url-loader?limit=30000&name=[name]-[hash].[ext]'}
		]
	},
	plugins: [
		extractCSS,
		// new BrowserSyncPlugin(
		// 	// BrowserSync options
		// 	{
		// 		// browse to http://localhost:3000/ during development
		// 		host: 'localhost',
		// 		port: 3032,
		// 		// proxy the Webpack Dev Server endpoint
		// 		// (which should be serving on http://localhost:3100/)
		// 		// through BrowserSync
		// 		proxy: {
		// 			target: 'http://localhost:3030/',
		// 			ws: true,
		// 		},
		//
		// 		open: false,
		// 		notify: false,
		// 		files: ['public/html/*.html', 'public/html/**']
		// 	},
		// 	// plugin options
		// 	{
		// 		// prevent BrowserSync from reloading the page
		// 		// and let Webpack Dev Server take care of this
		// 		reload: true,
		// 		// open: false
		// 	}
		// ),
		// new webpack.optimize.UglifyJsPlugin({
		// 	compress: { warnings: false }
		// })
	],
	sassLoader: {
		includePaths: [
			path.resolve('./node_modules/angular-material'),
			path.resolve('./src/client/admin'),
			path.resolve('./public'),
			...bourbonPaths,
			...bourbonNeatPaths,
		]
	},
	watch: true,
	devtool: '#source-map',
	node: {
		fs: 'empty'
	}
};

// const cssnano = require('cssnano');
// let OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
// webpackConfig.plugins.push(new OptimizeCssAssetsPlugin({
// 	// assetNameRegExp: /\.optimize\.css$/g,
// 	cssProcessor: cssnano,
// 	cssProcessorOptions: { discardComments: {removeAll: true } },
// 	canPrint: true
// }));

module.exports = webpackConfig;
