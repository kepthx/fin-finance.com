'use strict';

// const logger = require('../logger')('rpc');
// const fs = require('fs');
// const path = require('path');
const co = require('co');
const controllers = require('../controllers');
const _ = require('lodash');



let flatControllersList = _.chain(controllers).omit('admin').reduce((resultList, methods, controllerName) => {

	return _.reduce(methods, (resultList, method, methodName) => {
		resultList[`${controllerName}.${methodName}`.toLowerCase()] = co.wrap(method);
		return resultList;
	}, resultList);

}, {}).value();

// let bindControllers = spark =>
// console.log(flatControllersList);

let generatorWrapper = method => {
	return (...args) => {
		let answerCb = args.pop();
		return method(...args).then(result => answerCb(null, result)).catch(e => answerCb(e, null));
	};
};

let wrapController = spark => {

	spark.on('rpc', function (data, resultCb) {
		let { controller, method, args } = data;
		let fullMethodPath = controller.toLowerCase() + '.' + method.toLowerCase();

		let methodExists = fullMethodPath in flatControllersList;
		if (!methodExists) {
			return resultCb({
				type : 'error',
				code : 404,
				message : 'Not found'
			});
		}
		let responseObject = {
			params : args
		};

		method = generatorWrapper(flatControllersList[fullMethodPath].bind(responseObject));
		method(resultCb);
	});

	// _.reduce(flatControllersList, (spark, method, methodId) => spark.on(methodId, generatorWrapper(method)), spark)
	//TODO Add 404 error if not found

	// spark.on('data', function(data) {
	// 	// console.log(data);
    //      // ... update redis set with 'connected' users here
    // });

};





module.exports = wrapController;
