/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

const co = require('co');
const _ = require('lodash');

const {thinky, r} = require('./db');

//English LLP
let defaultItems = [
	{
		id : 'sku_001',
		title: 'Precious Invest Capital Trading Ltd',
		note : 'From the data we have gathered, the company was created in 2013-05-15 and has been overseen by four directors',
		language : 'en',
		section : 'offshore-companies',
		category : 'Scottish LP',
		incorporationDate : '01.06.2016',
		capital : '€ 1 000 000',
		options : [{ price : '1400' }]
	},
	{
		id : 'sku_002',
		title: 'Precious Invest Capital Trading Ltd',
		note : 'From the data we have gathered, the company was created in 2013-05-15 and has been overseen by four directors',
		language : 'en',
		section : 'offshore-companies',
		category : 'Scottish LP',
		incorporationDate : '01.06.2016',
		capital : '€ 1 000 000',
		options : [{ price : '1400' }]
	},
	{
		id : 'sku_003',
		title: 'Precious Invest Capital Trading Ltd',
		note : 'From the data we have gathered, the company was created in 2013-05-15 and has been overseen by four directors',
		language : 'en',
		section : 'offshore-companies',
		category : 'Scottish LP',
		incorporationDate : '01.06.2016',
		capital : '€ 1 000 000',
		options : [{ price : '1400' }]
	},
	{
		id : 'sku_004',
		title: 'KB Komercni Banka',
		logo: '/img/logo_bank_1.png',
		note : 'Currencies: CZK,USD,EUR, RUB, GBP, CHF, JPY, CAD, SEK',
		section : 'bank-account',
		language : 'en',
		category : 'Scottish LP',
		state : 'Czech Republic',
		incorporationDate : '01.06.2016',
		options : [{ price : '1500', description : 'Personal presence' }]
	},
	{
		id : 'sku_005',
		title: 'Ceska Sporitelna (Czech Republic)',
		logo: '/img/logo_bank_2.png',
		note : 'Currencies: CZK,USD,EUR, RUB, GBP, CHF, JPY, CAD, SEK',
		section : 'bank-account',
		state : 'Czech Republic',
		language : 'en',
		options : [{ price : '1500', description : 'Personal presence' }]
	},
	{
		id : 'sku_006',
		title: 'UniCredit Bank (Czech Republic)',
		logo: '/img/logo_bank_4.png',
		note : 'Currencies: CZK,USD,EUR, RUB, GBP, CHF, JPY, CAD, SEK',
		section : 'bank-account',
		state : 'Czech Republic',
		language : 'en',
		options : [
			{ price : '1500', description : 'Personal presence' },
			{ price : '2400', description : 'Remote opening' },
		]
	},
	{
		id : 'sku_007',
		title: 'Assistance with opening of EU merchant account for accepting credit card payments on your website',
		description : 'Opening period one week',
		section : 'merchant-account',
		language : 'en',
		options : [
			{ price : '300', description : 'Personal presence' }
		]
	},
	{
		id : 'sku_008',
		title: 'Precious Invest Capital Trading Ltd',
		note : 'From the data we have gathered, the company was created in 2013-05-15 and has been overseen by four directors',
		language : 'en',
		section : 'offshore-companies',
		category : 'Scottish LP',
		incorporationDate : '01.06.2016',
		capital : '€ 1 000 000',
		options : [{ price : '1400' }]
	},
	{
		id : 'sku_009',
		title: 'Precious Invest Capital Trading Ltd',
		note : 'From the data we have gathered, the company was created in 2013-05-15 and has been overseen by four directors',
		language : 'en',
		section : 'offshore-companies',
		category : 'Scottish LP',
		incorporationDate : '01.06.2016',
		capital : '€ 1 000 000',
		options : [{ price : '1400' }]
	},
	{
		id : 'sku_010',
		title: 'Precious Invest Capital Trading Ltd',
		note : 'From the data we have gathered, the company was created in 2013-05-15 and has been overseen by four directors',
		language : 'en',
		section : 'offshore-companies',
		category : 'Scottish LP',
		incorporationDate : '01.06.2016',
		capital : '€ 1 000 000',
		options : [{ price : '1400' }]
	},
	// {
	// 	id : 'sku_014',
	// 	title: 'Precious Invest Capital Trading Ltd',
	// 	note : 'From the data we have gathered, the company was created in 2013-05-15 and has been overseen by four directors',
	// 	language : 'en',
	// 	section : 'offshore-companies',
	// 	category : 'English LLP',
	// 	incorporationDate : '01.06.2016',
	// 	capital : '€ 1 000 000',
	// 	options : [{ price : '1300' }]
	// },
	{
		id : 'sku_015',
		title: 'Raiffeisen bank (Czech Republic)',
		logo: '/img/rb.jpg',
		note : 'Currencies: CZK,USD,EUR, RUB, GBP, CHF, JPY, CAD, SEK',
		section : 'bank-account',
		state : 'Czech Republic',
		language : 'en',
		options : [{ price : '1500', description : 'Personal presence' }]
	},
];

[
	'fro plus trading lp',
	'fro plus commerce lp',
	'dfa trading plus lp',
	'bazr trading lp',
	'bazr commerce lp',
	'dfa commerce lp'
].forEach((title, i) => {
	defaultItems.push({
		id: `sku_${('002' + i).slice(-3)}`,
		title,
		note: 'apostilled set of documents, two nominal offshore partners',
		language: 'en',
		section : 'offshore-companies',
		category : 'Scottish LP',
		incorporationDate : '27.10.2016',
		capital : '£ 100',
		options : [{ price : '1400' }]
	});
});

let userList = [

	{
		email: 'noname@nope.org',
		password: '1234321`',
	},

	{
		email: 'noname_2@nope.org',
		password: '1234321`',
	},



];

module.exports = function (thinky, models) {

	const {Field, Item, Option, User} = models;

	co(function* () {

		yield thinky.dbReady();
		// console.time("create_users");
		let emails = userList.map(currentUser => currentUser.email);
		// let testList = yield Item.filter({}).pager();
		// console.log(testList);

		try {
			let oldList = yield User.filter(currentUser => r.expr(emails).contains(currentUser('email'))).delete();
		} catch (e) {

		}

		let result = yield User.save(userList, {
			conflict: 'update'
		});

		let adminUser = result[0];
		adminUser.isAdmin = true;
		result[0] = yield adminUser.save();

		// console.timeEnd("create_users");


		// console.log(result);



		let optionIndex = 0, fieldIndex = 0;;

		yield defaultItems.map(co.wrap(function * (item) {

			let {options} = item;
			options = options.map(function (currentOption) {
				let currentIdx = `opt_${ optionIndex }`;
				currentOption.id = currentIdx;
				optionIndex++;
				return currentOption;
			});

			options = yield Option.save(options, {
				conflict: 'update'
			});


			let fields = _.reduce(item, function (result, value,  key) {
				if ('language id section category options'.split(' ').indexOf(key) >= 0) {
					return result;
				}

				fieldIndex++;

				result.push({
					id: 'field_' + fieldIndex,
					name: key,
					language: 'en',
					value: value,
				})

				return result;

			}, []);

			yield Item.filter({}).delete();

			let storeItem = yield Item.save({
				id: item.id,
				section: item.section,
				category: item.category,
			}, {
				conflict: 'update'
			});

			storeItem.options = options;
			storeItem.fields = yield Field.save(fields, {
				conflict: 'update'
			});

			yield storeItem.saveAll({ options: true, fields : true })
		}))


	}).catch(e => console.log(e));
};
