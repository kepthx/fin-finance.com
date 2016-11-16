/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';
const _ = require('lodash');
const {md5} = require('../../libs/crypto');
const logger = require('../logger')('common');

module.exports = {

	destinationRedirect (fallback, ctx) {
		ctx.destinationRedirect(fallback);
	},

	redirect (destination, status = 302) {
		return function () {
			this.status = status;
			this.redirect(destination);
		};
	},

	loadUser (userid) {
		return function* (next) {
			this.state.user = yield this.getFullProfile(userid);
			yield next;
		};
	},

	redirectIfLogged (redirectPath, ifIsLogged = false) {

		return function* (next) {

			let isRedirect = this.isLogged() === ifIsLogged;
			if (isRedirect) {
				return this.redirect(redirectPath);
			}

			yield next;
		};
	},

	formSuccess (viewName, successRedirect) {

		return function* (next) {

			let ctx = this;
			let {formStatus} = ctx.state;

			switch (formStatus) {
			case 'success':
				typeof successRedirect === 'function'
					? yield* successRedirect(ctx, next)
					: ctx.redirect(successRedirect);
				return ;

			default:
				typeof viewName === 'function'
					? yield* viewName(ctx, next)
					: yield ctx.render(viewName);
				return;
			}
		};
	},

	form (formId, formProcess = null, formValidate  = null) {

		return function* (next) {

			let ctx = this;

			let {forms} = ctx.state;
			ctx.state.forms = forms || {};

			let {id: sessionId} = ctx.session;
			let hashedFormID = md5(`${formId}_${sessionId}`);

			ctx.state.forms[formId] = {
				errors: {}, data: {}, isSuccess: false, id: hashedFormID
			};

			let formData = _.cloneDeep(ctx.method === 'POST'
					? ctx.request.body
				: ctx.method === 'GET'
					? ctx.request.query
				: {});

			let {form_id} = formData;
			if (form_id !== hashedFormID) { //Other form processed
				return yield next;
			}

			ctx.state.formStatus = 'ready';
			delete formData['form_id'];

			ctx.form = formData;
			ctx.state.forms[formId]['data'] = Object.assign({}, this.state.forms[formId], formData);

			try {

				switch (true) {
				case _.isFunction(formProcess):

					yield* formProcess(ctx, function * innerNext() {
						ctx.state.forms[formId].isSuccess = true;
						ctx.state.formStatus = 'success';

						yield next;
					});

					break;
				}


			} catch (e) {

				if (e instanceof Error) {
					this.state.forms[formId]['errors'] = Object.assign({}, this.state.forms[formId]['errors'], { 'all' : e.message});
					logger.error(e);
				} else {
					this.state.forms[formId]['errors'] = Object.assign({}, this.state.forms[formId]['errors'], e);
				}

				ctx.state.formStatus = 'error';

				yield next;
			}

			// yield next;
		};
	},

	view (viewName, data) {
		return function* (next) {

			if (data){

				switch (true) {

				case _.isFunction(data):
					data.bind(this);
					yield data(next);
					break;

				case _.isObject(data):
					this.state = Object.assign({}, this.state, data);
					break;
				}
			}

			yield this.render(viewName);
		};
	}
};
