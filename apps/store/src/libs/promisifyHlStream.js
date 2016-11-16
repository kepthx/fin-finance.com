'use strict';

const highland = require('highland');

module.exports = stream => {
	let promiseIsActive = false;
	stream = highland(stream);

	return new Promise((resolve, reject) => {

		stream.toArray((...args) => {
			if (!promiseIsActive) {
				resolve(...args);
				promiseIsActive = true;
			}
		});

		stream.on('error', (...args) => {
			if (!promiseIsActive) {
				reject(...args);
				promiseIsActive = true;
			}
		});
	});
};
