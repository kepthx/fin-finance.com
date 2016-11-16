'use strict';

const {join, resolve} = require('path');
const fs = require('fs');
const _ = require('highland');
const readdirStream = require('./readdirStream');

// const stat = _.wrapCallback(fs.stat);
// const readdir = _.wrapCallback(fs.readdir);

let scan = function scanFunction (scanPath, options = {}) {
	let stream = new readdirStream(scanPath, options);	
	return stream;
};



module.exports = {scan};
