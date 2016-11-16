'use strict';

const co = require('co');


let hookWrapper = cb => function (next) {
	let me = this;
	co(function * () { yield * cb.call(me); }).then(() => next()).catch(next);
	me = null;
};

module.exports = {hookWrapper};
