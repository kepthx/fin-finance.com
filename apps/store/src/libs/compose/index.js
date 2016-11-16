'use strict';

const co = require('co');

let isGenerator = obj => obj
	&& typeof obj.next === 'function'
	&& typeof obj.throw === 'function';

/**
 * This creates a generator from a promise or a value.
 *
 * TODO: try to avoid using a generator function for this.
 *
 * @returns {Iterator}
 */
let loggedDeprecationMessage = false;
function* promiseToGenerator(promise) {
	if (!loggedDeprecationMessage) {
		console.error('A promise was converted into a generator, which is an anti-pattern. Please avoid using `yield* next`!')
		loggedDeprecationMessage = true;
	}

	return yield Promise.resolve(promise);
}



class Wrapper {

	constructor(fn, ctx, next) {

		if (typeof fn !== 'function') {
			throw TypeError('Not a function!');
		}

		console.log(next);

		this._fn = fn;
		this._ctx = ctx;
		this._next = next;
		this._called = false;
		this._value = undefined;
		this._promise = undefined;
		this._generator = undefined;
	}


	get prevValue () {
		return this._next.value;
	}

	get value() {

		if (!this._called) {

			this._called = true;

			try {
				this._ctx.prev = this.prevValue;
				this._value = this._fn(this._ctx, this._next);
			} catch (e) {
				this._value = Promise.reject(e);
			}
		}

		return this._value;
	}

	get promise() {
		console.log('GET PROMISE');
		if (this._promise === undefined) {
			this._promise = isGenerator(this.value) ? co(this.value) : Promise.resolve(this.value);
		}

		return this._promise;
	}

	get generator () {

		if (this._generator === undefined) {
			this._generator = isGenerator(this.value) ? this.value : promiseToGenerator(this.value);
		}

		return this._generator;
	}

	get [Symbol.iterator] () {
		return this.generator;
	}

	then (...args) {
		return this.promise.then(...args);
	}

	catch (...args) {
		return this.promise.catch(...args);
	}

	next (...args) {
		return this.promise.next(...args);
	}

	throw (...args) {
		return this.promise.throw(...args);
	}
}


let noop = () => { console.log('NOOP');};


let compose = middlewares =>
	(ctx, next) => {

		let i = middlewares.length; next = new Wrapper(noop || next);
		while (i--) {
			next = new Wrapper(middlewares[i], ctx, next);
		}

		return next;
	};

module.exports = compose;
