/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

const config = require('config');

const { User, Profiles, TempPassword} = require('../models');
const mailer = require('../mailer');
const _ = require('lodash');
const passport = require('koa-passport');
const marketController = require('./marketController');

const log = require('../logger')('controllers/Auth');
const uuid = require('uuid');


let validateLib = require('../validator');
let validationOptions = require('../validator/validationOptions');
let authValidator = require('../validator/Auth');


let safeMail = email => {

	// let [login, host] = email.split('@');
	// let host = host.split('.');
	// let domainLast = host.pop;

	let emailSeparatorPosition = email.indexOf('@') + 1;
	let result = email.split('').reduce((result, currentLetter, index) => {

		switch (true) {
		case ['@', '.'].indexOf(currentLetter) >= 0 || index <= 1 || index === emailSeparatorPosition :
			result = result + currentLetter;
			break;
		default:
			result = result + '*';
		}

		return result;
	}, '');

	return result;
};

let AuthController = {

	* register (ctx, next) {

		let currentUser = yield AuthController.createUser(ctx);
		yield ctx.login(currentUser);
		yield marketController.transferCartToUser(ctx);

		yield next;
	},

	* createUser (ctx) {

		let data = ctx.form;
		yield validateLib.async(data, authValidator.registration, validationOptions);

		let {first_last, password} = data;

		if (first_last && first_last.length) {
			let [first, last] = first_last.split(' ');
			data.first = first;
			data.last = last;
		}

		let fullProile = Object.assign({}, data);

		let currentUser = new User(data);
		let currentProfile = new Profiles(fullProile);
		let tempPassword = new TempPassword({ password });

		currentUser.tempPassword = tempPassword;
		currentUser.language = ctx.state.language.code;
		yield currentUser.saveAll({tempPassword : true});

		currentProfile.owner = currentUser;

		yield currentProfile.saveAll({owner: true});


		currentUser.confirmationLink =
			ctx.state.link.origin + ctx.state.helpers.url('user.account.confirmation', currentUser);

		let mailData = _.cloneDeep(currentUser);
		mailData.language = ctx.state.language.code;

		mailData.password = password;
		mailData.account = _.cloneDeep(currentProfile);

		yield mailer.sendEmail('confirmation', mailData, ctx, {
			from : 'noreplay <noreplay@westtrade.tk>',
			to : currentUser.email,
			subject : ctx.i18n.__('Confirmation of registration')
		});

		//
		// yield mailer.sendEmail('info', mailData, this, {
		// 	from : 'noreplay <noreplay@westtrade.tk>',
		// 	to : currentUser.email,
		// 	subject : this.i18n.__('Registration complete!')
		// });

		currentUser = Object.assign({}, currentUser);

		return currentUser;
	},

	* logout (ctx) {

		ctx.logout();
		yield ctx.regenerateSession();

		ctx.redirect('back', '/index.html');
	},

	* login (ctx, next) {

		yield validateLib.async(ctx.form, authValidator.login, validationOptions);
		let passportAuthenticate = passport.authenticate('local', function* (err, user, info, status) {

			if (err) {
				throw err;
			}

			if (info) {
				throw info;
			}

			if (!user) {
				throw new Object({
					all : 'User with this combination of login and password dosn\'t exists'
				});
			}

			try {
				yield ctx.login(user);
			} catch (e) {
				log.error(e);
			}
		});

		yield * passportAuthenticate.call(ctx);
		yield next;

	},


	* recovery (ctx, next) {

		yield validateLib.async(ctx.form, authValidator.recovery, validationOptions);

		let {email} = ctx.form;
		let [currentUser] = yield User.filter({email});

		if (currentUser) {

			currentUser.resetToken = uuid.v4();
			yield currentUser.save();

			let mailData = Object.assign({}, currentUser);

			mailData.changePasswordLink =
				ctx.state.link.origin + ctx.state.helpers.url('user.account.changePasswordByToken', currentUser);

			ctx.state.forms.recovery.has_message = true;
			ctx.state.forms.recovery.safe_email = safeMail(currentUser.email);

			mailData.language = ctx.state.language.code;

			yield mailer.sendEmail('changePassword', mailData, ctx, {
				from : 'noreplay <noreplay@westtrade.tk>',
				to : currentUser.email,
				subject : ctx.i18n.__('Change password')
			});
		}

		yield next;
	}
};


module.exports = AuthController;
