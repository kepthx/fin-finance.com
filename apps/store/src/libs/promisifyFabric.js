'use strict';

let promisifyFabric = (fn, context = undefined) => {

	let isFunction = fn instanceof Function;
	if (!isFunction) {
		throw new Error('Callback not a function');
	}

	return (...args) => {
		return new Promise((resolve, reject) => {
			args.push((err, data) => err ? reject(err) : resolve(data));
			context ? fn(...args).bind(context) : fn(...args);
		});
	};
};

module.exports = promisifyFabric;
