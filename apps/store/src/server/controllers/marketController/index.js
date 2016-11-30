/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

const { Item, Option, CartItem } = require('../../models');
const { r } = require('../../models/db');
const _ = require('lodash');

// const mailer = require('../../mailer');


let buildItem = (ctx, currentItem) => {

	currentItem['language'] = ctx.state.language.code;

	let defaultFields = {};
	let defaultLanguage = 'en';
	// let languageIsDefault = ctx.state.language.code === defaultLanguage;

	let fields = currentItem.fields.reduce( (result, field) => {
		let {language, name, value} = field;

		if (language === defaultLanguage) {
			defaultFields[name] = value;
		}

		if (language === ctx.state.language.code) {
			result[name] = value;
		}

		return result;

	}, {});

	currentItem = Object.assign({}, currentItem, defaultFields, fields);

	return currentItem;
};

let storeItemCategoryReducer = ctx => {

	return (result, currentItem) => {
		let {category} = currentItem;

		if (!(category in result)) {
			result[category] = [];
		}

		result[category].push(buildItem(ctx, currentItem));
		return result;
	};
};


let historyOrderFilter = userId => {
	return currentItem => currentItem('userId').eq(userId).and(currentItem('status').eq('pending'));
};


let calculateTotalPrice =  (result, currentItem) => {
	result += parseFloat(currentItem.price);
	return result;
};

module.exports = {

	* ordersHistory (next) {

		let user = this.user;
		let {id : userId} = (user || {});

		if (!userId) {
			return;
		}

		let items = yield CartItem.filter(historyOrderFilter(userId)).getJoin({
			option: {
				item: {
					fields: true
				}
			}
		});


		this.state.orders_list = {
			data : items
		};

		yield this.render('account/orders');
	},

	* cartCheckoutMethod (next) {

		let basket = yield this.basket.list();
		let idsList = _.map(basket.items, item => item.id);

		let itemsList = yield CartItem.filter(current => {
			return r.expr(idsList).contains(current('id'));
		});

		itemsList = yield itemsList.map(function (item) {
			item.status = 'pending';
			return item.save();
		});


		// console.log(itemsList);


		yield this.render('cart/step_3');
	},

	* transferCartToUser (ctx) {

		let {id: sessionId} = ctx.session;
		let user = ctx.user;
		let {id : userId} = (user || {});

		if (!userId) {
			return;
		}

		let items = yield CartItem.filter(current => {
			return current('sessionId').eq(sessionId);
		});

		yield items.map(function (item) {
			item['userId'] = userId;
			item['sessionId'] = null;

			return item.save();
		});

	},

	* deleteFromCart (next) {

		let {id: sessionId} = this.session;
		let user = this.user;
		let {id : userId} = (user || {});
		let { request: {query: {destination}}} = this;
		let { items } = this.params;
		let {isRpcMethod} = this.query;

		items = items.split(',');

		yield CartItem.filter(current => {
			return r.expr(items).contains(current('id')).and(
				userId
					? current('sessionId').eq(sessionId).or(
						current('userId').eq(userId)
					)
					: current('sessionId').eq(sessionId)
			).and(current('status').eq('in cart'));
		}).delete();

		if (!isRpcMethod){

			destination = destination || 'back';
			this.redirect(destination, '/user/cart.html');
		}

		let cartItems = yield this.basket.list();

		let total = cartItems.items.reduce(calculateTotalPrice, 0);

		let {language} = this.state;

		let result = {
			basket : {
				added : [],
				items : cartItems.items,
				removed: yield this.basket.removed(items),
				total,
				language,
			}
		};

		this.body = result;
	},

	* addToCart (next) {

		let {destination} = this.request.query;
		let {items, isRpcMethod} = this.request.body;

		// console.log(items);

		//TODO Add error if items is empty
		if (items) {

			items = Array.isArray(items) ? items : [items];

			let options = yield Option.filter(function (option) {
				return r.expr(items).contains(option('id'));
			}).getJoin({ item: true });


			let user = this.user;
			user = user || {};
			let {id: userId} = user;


			let cartItems = yield options.map(option => {
				let cartItem = new CartItem({
					user : userId,
					sessionId : this.session.id,
					option
				});

				return cartItem.saveAll();
			});
		}

		if (!isRpcMethod){
			destination = destination || 'back';
			return this.redirect(destination, '/user/cart.html');
		}

		let cartItems = yield this.basket.list();

		let total = cartItems.items.reduce(calculateTotalPrice, 0);

		let {language} = this.state;

		let result = {
			basket : {
				added : yield this.basket.added(items),
				items : cartItems.items,
				deleted: [],
				total,
				language,
			}
		};

		this.body = result;
	},

	* specialOffersPage (next) {

		let groups = ['bank-account', 'offshore-companies', 'merchant-account'];
		let items = yield Item.getJoin({ fields : true, options: true }).filter(function (item) {
			return r.expr(groups).contains(item('section'));
		});



		items = _
			.chain(items)
			.map(currentItem => {
				let item = buildItem(this, currentItem);
				return item;
			})
			.groupBy('section')
			.value();

		items['bank-account'] = items['bank-account'].map(function (account) {

			let tmpTitle = account.title.replace(/[(].*[)]/gim, '').trim();
			account.title = tmpTitle;
			account.note = account.note.replace('Currencies: ', '').trim();

			// console.log(account);
			return account;
		});

		this.state.items = items;

		yield this.render('pages/so');
	},

	* bankAccountPage (next) {

		let items = yield Item.filter({ section : 'bank-account'})
			.getJoin({ fields: true, options: true})
			;

		// console.log(items[0]);

		this.state.items = items.reduce((result, currentItem) => {
			result[currentItem.id] = buildItem(this, currentItem);
			return result;
		}, {});

		// console.log(this.state.items);

		yield this.render('pages/ba');
	},

	* offshorePage (next) {

		let items = yield Item.filter({ section : 'offshore-companies'})
			.getJoin({ fields: true, options: true})
			;

		this.state.items = items.reduce(storeItemCategoryReducer(this), {});
		console.log(this.state.items)
		yield this.render('pages/rmc');
	}
};
