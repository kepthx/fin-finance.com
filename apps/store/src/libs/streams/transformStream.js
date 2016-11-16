'use strict';

const {Transform} = require('stream');
const compose = require('../compose');


class transformStream extends Transform {

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
		let composition = compose(this.__stack);

		composition(ctx).then(result => {

			switch (true) {
			case this.__stack.length === 0:
				this.push(chunk, enc);
				break;
			default:
				this.push(result, enc);
			}

			next();

		}).catch(next);
	}
}



module.exports = transformStream;
