/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

const config = require('config');
const { User, Profiles } = require('../models');
const mailer = require('../mailer');
let validationOptions = require('../validator/validationOptions');
const validator = require('../validator');
const {changePassword, constraintsProfileEdit} = require('../validator/Account');

let common = require('./commonController');
const _ = require('lodash');




module.exports = {

	* index () {

		let userInfo = yield User
			.get(this.user.id)
			.getJoin({ profile : true });

		this.state.confirmed = false;
		this.state.userInfo = userInfo;


		if (this.session.isConfirmed) {
			this.state.isConfirmed = true;
			this.session.isConfirmed = null;
			delete this.session.isConfirmed;
		}

		yield this.render('account/info');
	},

	* confirmAccount (next) {
		//TODO Add additional check for user and user in session
		let { activationToken } = this.params;

		let filter = this.user
			? { activationToken, id : this.user.id }
			: { activationToken };

		let [currentAccount] = yield User.filter(filter);

		if (!currentAccount) {
			//TODO Add security error message - wrong token
			// common.destinationRedirect('/user/account.html', this);
			this.redirect('/user/account.html');
			return;
		}

		this.session.isConfirmed = true;
		currentAccount.activationToken = null;
		yield currentAccount.save();

		let userData = Object.assign({}, currentAccount);
		this.logout();
		yield this.login(userData);

		let [currentProfile] = yield Profiles
			.filter({userId : userData.id})
			.getJoin({owner : {tempPassword: true}});

		let {password} = currentProfile.owner.tempPassword;
		let mailData = {
			email: currentProfile.email,
			language: this.state.language.code,
			password,
			account: _.cloneDeep(currentProfile)
		};

		yield currentProfile.owner.tempPassword.delete();

		yield mailer.sendEmail('info', mailData, this, {
			from : 'noreplay <noreplay@westtrade.tk>',
			to : currentProfile.email,
			subject : this.i18n.__('Registration complete!')
		});

		this.redirect('/user/account.html');
	},

	* resendConfirmation (next) {

		let currentAccount = yield User.get(this.user.id);

		currentAccount.confirmationLink =
			this.state.link.origin + this.state.helpers.url('user.account.confirmation', currentAccount);
		// console.log(this.state);

		yield mailer.sendEmail('confirmation', currentAccount, this, {
			from : 'noreplay <noreplay@westtrade.tk>',
			to : currentAccount.email,
			subject : this.i18n.__('Confirmation of registration')
		});

		common.destinationRedirect('/user/account.html', this);
	},


	* editFormShow(next) {
		this.state['personalAccountEditForm'] = {
			errors: {}, data: {}, isSuccess: false
		};

		this.state.userInfo = yield User.get(this.user.id).getJoin({ profile : true });
		yield this.render('account/edit');

	},

	* edit(next) {

		let userInfo = yield User.get(this.user.id).getJoin({ profile : true });
		this.state.userInfo = userInfo;

		let data = this.request.body;

		let hasErrors = false;

		this.state['personalAccountEditForm'] = {
			errors: {}, data: {}, isSuccess: false
		};


		try {
			yield validator.async(data, constraintsProfileEdit(userInfo), validationOptions);
		} catch (fieldErrors) {
			hasErrors = true;
			this.state['personalAccountEditForm'].errors = fieldErrors;
			console.log(fieldErrors);
		}

		this.state.userInfo.profile = data;

		if (hasErrors) {
			yield this.render('account/edit');
			return
		}

		let {first_last, password} = data;

		if (first_last && first_last.length) {
			let [first, last] = first_last.split(' ');
			data.first = first;
			data.last = last;
		}

		let [userProfile] = yield Profiles.filter({userId: this.user.id});
		yield Profiles.get(userProfile.id).update(data).run();
		let {email} = data;

		if (email) {
			yield User.get(this.user.id).update({email}).run();
		}

		this.redirect('/user/account.html');

		// yield this.render('account/edit');

	},

	* changePasswordByToken (next) {

		let ctx = this;
		let {resetToken} = ctx.params;

		let [currentUser] = yield User.filter({resetToken});
		if (!currentUser) {
			return yield this.notFound();
		}

		yield this.login(currentUser);
		this.i18n.setLocale(currentUser.language);

		this.state.forms.change_password.data.reset_token = resetToken;

		yield next;
	},

	* changePassword (ctx, next) {

		yield validator.async(ctx.form, changePassword('reset_token' in ctx.form, ctx.user.id), validationOptions);

		let {password} = ctx.form;
		let currentUser = yield User.get(ctx.user.id);
		yield currentUser.changePassword(password);

		yield next;
	}
};
