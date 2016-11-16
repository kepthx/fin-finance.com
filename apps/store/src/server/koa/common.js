/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

const { CartItem, User } = require('../models');
const { r } = require('../models/db');

let destinationRedirect = function (fallback) {
	let ctx = this;
	let {destination} = ctx.query;
	destination = destination || 'back';
	ctx.redirect(destination, fallback);
};

let isLogged = function () {
	let user = this.user;
	return !!user;
};

let addedItems = function* (...goodsIdsList) {
	let {user} = this;
	return !!user;
};

let removedItems = function* (...goodsIdsList) {
	let {user} = this;
	return !!user;
};

let totalCalculator = (currentPrice, itemInOrder) => parseFloat(currentPrice) + itemInOrder.price;


let itemsInBasket = function* () {

	let user = this.user;
	user = user || {};
	let {id : userId}  = user;

	let items = yield CartItem.filter(item => {
		return item('status').eq('in cart').and(
			userId
				? item('sessionId').eq(this.session.id).or(
					item('userId').eq(userId)
				)
				: item('sessionId').eq(this.session.id)
		);
	}).getJoin({option: {item : {fields : true }}});

	// console.log(items);

	items = items.map(current => {

		let {id, option: {item : {fields, section}, price}} = current;

		price = parseFloat(price);

		fields = fields.reduce((result, field) => {
			let {name, value} = field;
			result[name] = value;
			return result;
		}, {});

		let {title, note: description} = fields;

		return {title, description, price, id};
	});


	let total = items.reduce(totalCalculator, 0);

	return {
		items,
		total
	};
};


let getFullProfile = function* (userId) {

	if (!userId) {
		if (!this.user) {
			return false;
		}

		userId = this.user.id;
	}

	return yield User.get(userId).getJoin({profile: true});
};


let notFound = function* () {
	this.status = 404;
	yield this.render('common/404');
};

module.exports = koaApp => {

	koaApp.use(function* (next) {

		this.destinationRedirect = destinationRedirect.bind(this);
		this.isLogged = isLogged.bind(this);
		this.getFullProfile = getFullProfile.bind(this);
		this.notFound = notFound.bind(this);

		this.basket = {
			added : addedItems.bind(this),
			removed : removedItems.bind(this),
			list : itemsInBasket.bind(this),
		};

		yield next;
	});


	koaApp.use(function* (next) {

		let {helpers} = this.state;
		helpers = helpers || {};

		helpers.json = function (...args) {
			return JSON.stringify(args);
		};

		this.state.helpers = helpers;

		yield next;
	});

	koaApp.use(function* (next) {

		this.state.session = Object.assign({}, this.session);

		let {flash} = this.session;
		if (flash) {
			this.state.flash = flash;
			delete this.session.flash;
		}

		yield next;
	});

};
