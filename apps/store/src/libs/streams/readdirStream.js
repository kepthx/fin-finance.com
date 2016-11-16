'use strict';

const {Readable} = require('stream');
const fs = require('fs');
const {join} = require('path');

let defaultOptions = {depth: -1, isSync: false };

class readdirStream extends Readable {

	constructor(...allOptions) {
		super({ objectMode: true, highWaterMark: 1 });

		let [options, ...otherOptions] = allOptions;

		if (typeof options === 'number' || options instanceof Number) {
			let depth = options;
			options = {depth};
		}

		if (typeof options === 'string' || options instanceof String) {
			let scanPath = options;
			options = {path: scanPath};
		}

		if (typeof options === 'boolean' || options instanceof Boolean) {
			let isSync = options;
			options = {isSync};
		}

		options = otherOptions.reduce((result, currentOption) => {
			result = Object.assign({}, result, currentOption);
			return result;
		}, options);

		let {path: scanPath} = options;

		this._queue = [scanPath];
		this.__options = Object.assign({}, defaultOptions, options);
	}

	get isSync() {
		return !!this.__options.isSync;
	}

	set isSync(setValue) {
		this.__options.isSync = !!setValue;
	}

	get depth() {
		let {depth} = this.__options;
		depth = parseInt(depth);
		depth = isNaN(depth) ? -1 : depth;
		return depth;
	}

	set depth(depthValue) {
		let depth = parseInt(depthValue);
		depth = isNaN(depth) ? -1 : depth;
		this.__options.depth = depth;
	}

	_read (size) {

		if (this._queue.length === 0) {
			return this.push(null);
		}

		if (this.depth > 0) {
			this.depth = this.depth - 1;
		}

		let currentEntry = this._queue.shift();
		let {depth} = this.__options;

		let methodName = this.isSync ? '__readSync' : '__readAsync';
		this[methodName](currentEntry, depth);
	}

	__readSync(currentEntry, depth = -1) {

		try {
			let currentPathStats = fs.statSync(currentEntry);
			if (!currentPathStats.isDirectory()) {
				return this.push({path: currentEntry, stats: currentPathStats});
			}

			let entriesList = fs.readdirSync(currentEntry);
			if (depth !== 0){
				let len = entriesList.length;
				while (len--)  {
					this._queue.push(join(currentEntry, entriesList[len]));
				}
			}

			this.push({path: currentEntry, stats: currentPathStats});

		} catch(error) {
			return this.emit('error', error);
		}
	}

	__readAsync(currentEntry, depth = -1) {

		fs.stat(currentEntry, (error, currentPathStats) => {
			if (error) {
				return this.emit('error', error);
			}

			if (!currentPathStats.isDirectory()) {
				return this.push({path: currentEntry, stats: currentPathStats});
			}

			return fs.readdir(currentEntry, (error, entriesList) => {
				if (error) {
					return this.emit('error', error);
				}

				if (depth !== 0) {
					let len = entriesList.length;
					while (len--)  {
						this._queue.push(join(currentEntry, entriesList[len]));
					}
				}

				this.push({path: currentEntry, stats: currentPathStats});
			});
		});
	}
}

module.exports = readdirStream;
