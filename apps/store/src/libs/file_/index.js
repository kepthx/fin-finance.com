'use strict';

const {join, resolve} = require('path');
const fs = require('fs');
const promisifyFabric = require('../promisifyFabric');

const stat = promisifyFabric(fs.stat);
const readdir = promisifyFabric(fs.readdir);

let scan = function scanFunction (scanPath, depth = -1) {
	scanPath = resolve(scanPath);
	let resultPathList = [scanPath];

	if (depth > 0) {
		depth = depth - 1;
	}

	return stat(scanPath).then(pathStat => {

		if (pathStat.isDirectory()) {
			return readdir(scanPath).then(subPathList => {
				let fullList = subPathList.map(currentPath => {
					let fullPath = join(scanPath, currentPath);
					return depth !== 0 ? scan(fullPath, depth) : [fullPath];
				});

				return Promise.all(fullList)
					.then(appendList => resultPathList.concat(...appendList))
				;
			});
		}

		return resultPathList;
	});
};


let scanSync = function scanSyncedFunction (scanPath, depth = -1) {
	scanPath = resolve(scanPath);
	let resultPathList = [scanPath];

	if (depth > 0) {
		depth = depth - 1;
	}

	let pathStat = fs.statSync(scanPath);
	if (pathStat.isDirectory()) {

		resultPathList = fs.readdirSync(scanPath)
			.map(currentPath => join(scanPath, currentPath))
			.reduce((resultList, currentPath) => {
				let subContentList =  depth !== 0 ? scanSync(currentPath, depth) : [currentPath];
				return resultList.concat(...subContentList);
			}, resultPathList);
	}

	return resultPathList;
};


module.exports = {scan, scanSync};
