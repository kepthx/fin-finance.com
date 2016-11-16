'use strict';

const {Transform} = require('stream');
const compose = require('../compose');


class filterStream extends Transform {

	constructor(options = { objectMode: true, highWaterMark: 1}) {
		super(options);
		this.__stack = [];
	}

	use (...midlewares) {
		this.__stack.push(...midlewares);
		return this;
	}

	_transform (chunk, enc, next) {

		let stream = this;
		let ctx = {stream, chunk, enc};

		compose(this.__stack)(ctx)
			.then(result => {

				if (this.__stack.length === 0) {
					result = true;
				}

				if (Boolean(result)) {
					this.push(chunk);
				}

				next();

			}).catch(next);
	}
}



module.exports = filterStream;
