/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

const config = require('config');
const locale = require('koa-locale');
const i18n = require('koa-i18n-2');
const qs = require('qs');
const {
	reduce,
	assign,
	// omit,
} = require('lodash');

// const logger = require('../logger')('koa/i18n');
const LANGUAGE_PARAM_NAME = config.get('locale.param_name');
const LANGUAGE_DEFAULT_CODE = config.get('locale.default');

const {User} = require('../models');
const _ = require('lodash');

let langUrlGenerator = (ctx) => {

	return (languageCode = LANGUAGE_DEFAULT_CODE) => {

		let currentLanguage = {};
		currentLanguage[LANGUAGE_PARAM_NAME] = languageCode;

		let params = assign({}, ctx.query, currentLanguage);
		// return ctx.request.origin  + ctx.path + '?' + qs.stringify(params);
		return ctx.path + '?' + qs.stringify(params);
		// return qs.stringify();
	};
};

let languages = reduce(config.get('languages'), (result, langInfo, langKey) => {

	langInfo['code'] = langKey;
	result[langKey] = langInfo;

	return result;

}, {});


let numberWithCommas = x => {
	x = x || 0;
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

let languageMiddleware = function*  (next) {

	let ctx = this;
	let user = ctx.user;

	if (user) {
		let {language: userLanguage} = user;
		if (userLanguage in languages) {
			ctx.i18n.setLocale(userLanguage);
		}
	}

	ctx.state.languages = languages;

	let currentLanguageKey = ctx.i18n.getLocale().toLowerCase();

	currentLanguageKey = currentLanguageKey in languages
		? currentLanguageKey
		: config.get('locale.default');

	ctx.state.language = languages[currentLanguageKey];


	let {helpers} = ctx.state;
	helpers = helpers || {};

	ctx.state.helpers = Object.assign({}, helpers, {
		languageLink : langUrlGenerator(this),
		stringify : obj => JSON.stringify(obj),
		formatPriceItem : item => '€ ' + numberWithCommas(item.price),
		formatPrice : price => '€ ' + numberWithCommas(price),
		activeCartStep: (activeStep, currentStep) => parseInt(currentStep) <= parseInt(activeStep) ? 'active' : ''
	});

	if (LANGUAGE_PARAM_NAME in this.query && this.query[LANGUAGE_PARAM_NAME] in languages) {

		let newLanguage = this.query[LANGUAGE_PARAM_NAME];
		ctx.cookies.set(LANGUAGE_PARAM_NAME, newLanguage, { signed: true });

		if (user) {
			let currentUser = yield User.get(user.id);
			currentUser.language = newLanguage;
			yield currentUser.save();

			console.log(currentUser);
		}

		// let params = qs.stringify(omit(this.query, LANGUAGE_PARAM_NAME));
		// let pathWithoutLang = this.path + (params.length ? '?' + params : '');

		ctx.i18n.setLocale(newLanguage);
		ctx.state.language = languages[newLanguage];

		// this.status = 301;
		// this.redirect(pathWithoutLang);
	}

	yield next;
};



module.exports = koaApp => {

	locale(koaApp, LANGUAGE_PARAM_NAME);
	let i18nConf = _.cloneDeep(config.get('i18n'));
	koaApp.use(i18n(koaApp, i18nConf));
	koaApp.use(languageMiddleware);

};
