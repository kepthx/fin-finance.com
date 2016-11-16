/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

const config = require('config');
const nodemailer = require('nodemailer');
const htmlToText = require('nodemailer-html-to-text').htmlToText;
const smtpTransport = require('nodemailer-smtp-transport')(config.get('mailer.smtp'));
const mailer = nodemailer.createTransport(smtpTransport);
mailer.use('compile', htmlToText());

const render = require('co-render');
const fs = require('fs');
const { resolve } = require('path');
const { mjml2html } = require('mjml');
const promisifyFabric = require('../../libs/promisifyFabric');

const Handlebars = require('handlebars');

let readFile = promisifyFabric(fs.readFile);
let stat = promisifyFabric(fs.stat);


let templatesCache = {};


//TODO Prevent re register helpers
// Handlebars.registerHelper('__', function(...args) {
// 	return i18n.__(...args);
// });
//
// try {
//
// 	let footerContent = fs.readFileSync(footerPath, 'utf-8');
// 	// footerContent = mjml2html(footerContent);
// 	Handlebars.registerPartial('footer', footerContent)
// } catch (e) {
// 	console.log(`Шаблон ${footerPath} не существует`);
// }

Handlebars.registerHelper("inc", function(value, options) {
    return parseInt(value) + 1;
});



Handlebars.registerHelper('ifc', function(v1, v2, options) {

	if(v1 === v2) {
		return options.fn(this);
	}
	return options.inverse(this);
});



module.exports = {

	* render (templateName, data, ctx) {

		let {language} = data;

		// let language = ctx.state.language.code;
		let i18n = ctx.i18n;
		if (!language || !language.length) {
			language = 'en';
		}

		data.language = language;

		let {publicUrl} = data;
		data.publicUrl = publicUrl ? publicUrl : 'https://fin-finance.com';

		try {
			Handlebars.registerPartial('footer', yield readFile(resolve('src/views/mails/parts/footer.hbs.mjml'), 'utf-8'))
		} catch (e) {
			console.log(`Шаблон FOOTER не существует`);
		}
		try {
			Handlebars.registerPartial('head', yield readFile(resolve('src/views/mails/parts/head.hbs.mjml'), 'utf-8'))
		} catch (e) {
			console.log(`Шаблон HEAD не существует`);
		}


		if (templateName in templatesCache) {
			return templatesCache[templateName](data);
		}

		let languageFile = 'index' + (language === 'en' ? '' : `_${language}`);
		let templatePath = resolve('src/views/mails', templateName, `${languageFile}.hbs.mjml.html`);
		let templateStat;
		try {
			templateStat = yield stat(templatePath);
		} catch (e) {
			console.log(`Шаблон ${templatePath} не существует`);
		}

		if (!templateStat) {
			data.language = 'en';
			templatePath = resolve('src/views/mails', templateName, 'index.hbs.mjml.html');
			templateStat = yield stat(templatePath);
		}

		let fileContent = yield readFile(templatePath, 'utf-8');
		let mjml = Handlebars.compile(fileContent)(data);
		let content = mjml2html(mjml);
		// templatesCache[templateName] = template;

		return content;
	},

	* sendEmail (templateName, data, ctx, ...args) {
		args[0]['html'] = yield this.render(templateName, data, ctx);
		// args[0]['html'] = yield readFile('public/mails/letter_1/index.html', 'utf-8');
		return mailer.sendMail(...args);
	}
};
