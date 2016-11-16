/**
 * @author Popov Gennadiy <me@westtrade.tk>
 */

const models = require('../models');
const {r} = require('../models/db');


const validateLib = require('validate.js');
validateLib.Promise = Promise;
const co = require('co');


validateLib.validators.fieldIsUnique = co.wrap(function* (value, options, key, attributes) {

	let message = 'Field is not unique';
	if((typeof options === 'object') && (options !== null)) {
		message = 'message' in options ? options.message : message;
	}


	let { exclude, model } = options;


	if(exclude && exclude === value) {
		return;
	}

	let currentModel = models[model];

	let objects = yield currentModel.filter(currentObject =>
		exclude
			? currentObject(key).eq(value).and(currentObject(key).ne(exclude))
			: currentObject(key).eq(value)
	);

	return objects.length ? message : null;
});

validateLib.validators.checkUser = co.wrap(function* (value, options, key, attributes) {

	let message = 'Field is not unique';
	if((typeof options === 'object') && (options !== null)) {
		message = 'message' in options ? options.message : message;
	}


	let {user:userId, type} = options;
	let currentUser = yield models.User.get(userId);

	let errorMessage = null;
	switch (true) {
	case type === 'token':
		if (currentUser.resetToken !== value){
			errorMessage = 'The tokens do not match, please repeat password change request';
		}
		break;
	default:
		let passwordIsValid = yield currentUser.validatePassword(value);
		if (!passwordIsValid) {
			errorMessage = 'Old password do not match';
		}
	}

	return errorMessage;
});



module.exports = validateLib;
