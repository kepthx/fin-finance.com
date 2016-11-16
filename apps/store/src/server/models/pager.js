'use strict';

const {thinky, r, Query} = require('./db');
const co = require('co');

let defaultOptions =  {
    quantity : 10,
    cycled : false,
    max : 10,
    id : "page"
};

module.exports = function pager(current, options = defaultOptions) {

	// let totalItems = yield this.count();

	options = options || defaultOptions;
	options = Object.assign({}, options, defaultOptions);

	let totalPages = 0;

	let query = this;






	//
	// console.log(Object.keys(this));
	// console.log(this._query);
	//
	let {_model, _query} = query;




	// console.log(_model.getTableName());

	//
	//
	//
	// console.log(_model);

	return co(function* () {

		// let countQuery = new Query(r.table(_model.getTableName()), _query);
		// let totalItemsCount = yield countQuery.count();


		//
		// let totalItemsCount = yield r.table(_model.getTableName()).query(function () {
		// 	return _query;
		// }).count();
		// console.log(totalItemsCount);


		// let totalItems = yield query.count({});
		// console.log(totalItems);

		return yield query;
	});


	// return this;

	// return this.then(result => {
	//
	//
	//
	// })

	//
	// let defaultPager = {
	// 	data : []
	// }
	//
	// return this.reduce(function (left, right) {
	// 	defaultPager.data
	// 	return defaultPager;
	// })

	// return this.limit(1)
	// .reduce(function (result, current) {
	// 	return r.js(`(function (row) { return {
	//         data : [],
	//         pager : {
	//             first: 1,
	//             max : options.max,
	//             count : 0,
	//             quantity : options.quantity,
	//             current : current,
	//             last : totalPages,
	//             id : options.id
	//         }
	//     } })`)
	// });


};
