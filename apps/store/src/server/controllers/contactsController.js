/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

const config = require('config');
const { ContactRequests } = require('../models');
const validateLib = require('validate.js');
const uuid = require('uuid');
const mailer = require('../mailer');

validateLib.Promise = Promise;


var constraints = {

	fullName: {
		presence: {
			message : "Field `Name` can't be blank"
		},

		length: {
			minimum: 3,
			maximum: 100,
			tooShort : "Field `Name` minimum is %{count} characters",
			tooLong : "Field `Name` is is too long (max is %{count} chars)"
		},
	},

	email : {

		presence:  {
			message : "Field `E-mail` can't be blank"
		},

		email: {
			message : "Field `E-mail` is not a valid email"
		},

		length: {
			minimum: 3,
			maximum: 100,
			tooShort : "Field `E-mail` minimum is %{count} characters",
			tooLong : "Field `E-mail` is is too long (max is %{count} chars)"
		},
	},

	phone : {
		presence: {
			message : "Field `Phone` can't be blank"
		},
		length: {
			minimum: 3,
			maximum: 100,
			tooShort : "Field `Phone` minimum is %{count} characters",
			tooLong : "Field `Phone` is is too long (max is %{count} chars)"
		},
	},

	theme : {
		presence: {
			message : "Field `Theme` can't be blank"
		}
	},

	text : {
		// presence: true,
		length: {
			maximum: 400,
			tooLong : "Field `Text` is is too long (max is %{count} chars)"
		},
	},

};

let validationOptions = {
	// format: "grouped" /*"flat"*/,
	// cleanAttributes: false,
	fullMessages: false,
};


module.exports = {

	* store (data, ctx) {

		let result = null;
		yield validateLib.async(data, constraints, validationOptions);

		let user = this.user
		if (user) {
			data['userId'] = user.id;
		}

		data['sessionId'] = ctx.session.id;
		data['ip'] = ctx.ip;
		data['userLanguage'] = ctx.state.language.code;

		result = yield ContactRequests.save(data);
		return result;
	},

	* sendEmail(data, ctx) {

		data['ip'] = ctx.ip;
		data['userLanguage'] = ctx.state.language.code;

		yield mailer.sendEmail('contactRequest', data, ctx, {
			from: config.get('email.from'),
			to: config.get('email.to.contactsForm'),
			subject : 'Новая заявка от ' + data.email
		});
	}
};
