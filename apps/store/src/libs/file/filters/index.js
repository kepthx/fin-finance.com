'use strict';

const minimatch = require('minimatch');
const {extname} = require('path');


let typesMap = {

	file (ctx) {
		let {chunk : {stats}} = ctx;
		return stats.isFile();
	},

	folder (ctx) {
		let {chunk : {stats}} = ctx;
		return stats.isDirectory();
	},

	link (ctx) {
		let {chunk : {stats}} = ctx;
		return stats.isSymbolicLink();
	},

	socket (ctx) {
		let {chunk : {stats}} = ctx;
		return stats.isSocket();
	},
};

let	is = function (...types) {

	types.forEach(currentType => {
		if (!typesMap.hasOwnProperty(currentType)) {
			throw new Error(`Wrong filter type ${currentType}`);
		}
	});

	return function (ctx) {

		let result =  types.reduce((result, typeName) => {
			if (result === true) {
				return true;
			}
			result = typesMap[typeName.replace('!', '')](ctx);
			return typeName.indexOf('!') >= 0 ? !result : result;
		}, false);

		return Promise.resolve(result);
	};
};

let glob = mask => {
	return ctx => {
		let {chunk:{path}} = ctx;
		let result = minimatch(path, mask);
		return Promise.resolve(result);
	}
};

let match = regexp => {
	return (ctx) => {
		let {chunk:{path}} = ctx;

		console.log('match', this);

		let result = regexp.test(path);
		return Promise.resolve(result);

	}
};

let ext = (...extnames) => {
	extnames = extnames.map(extname => '.' + extname.replace(/^[.]/, ''));
	return (ctx) => {
		let {chunk:{path, stats}} = ctx;
		let currentExtname = extname(path);

		console.log('ext', this);
		let result = (stats.isFile() || stats.isSymbolicLink()) && extnames.includes(currentExtname);
		return Promise.resolve(result);
	}
};


module.exports = {is, glob, match, ext};
