/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

const thinky = require('./db');
const {type, r} = thinky;
// const uuid = require('uuid');

const pager = require('./pager');



const TempPassword = require('./TempPassword');
const User = require('./Auth');



const ShippingAddress = thinky.createModel('ShippingAddress', {
	id: type.string(),
	userId: type.string(),
	country: type.string().min(3).max(100),
	city: type.string().min(3).max(100),
	address: type.string().min(3).max(100),
	createdAt: type.date().default(r.now()),
	updatedAt: type.date().default(r.now()),
}, {
	enforce_extra: 'remove',
	// enforce_missing: true,
});


const Profiles = require('./Profiles');

const Aliases = thinky.createModel('Alias', {
	id: type.string(),
	alias: type.string().required(),
	path: type.string().required(),
	createdAt: type.date().default(r.now()),
	updatedAt: type.date().default(r.now()),
}, {
	enforce_extra: 'remove',
	// enforce_missing: true,
});





User.hasOne(Profiles, 'profile', 'id', 'userId');
Profiles.belongsTo(User, 'owner', 'userId', 'id');

const ContactRequests = thinky.createModel('ContactRequest', {
	id: type.string(),
	ip: type.string().default(''),
	sessionId: type.string().default(''),
	userId: type.string().default(''),
	fullName: type.string().min(3).max(100).required(),
	email: type.string().min(3).max(100).email().required(),
	phone: type.string().min(3).max(100).required(),
	text: type.string().max(400).default(''),
	theme: type.string().max(100),
	userLanguage: type.string().max(100),
	theme: type.string().max(100),
	createdAt: type.date().default(r.now()),
}, {
	enforce_extra: 'remove',
	// enforce_missing: true,
});


const Cards = thinky.createModel('Card', {
	id: type.string(),
	cardType : type.string().enum(['visa', 'master', 'maestro']).required(),
	cardHolderName: type.string().required(),
	cardNumber: type.string().required(),
	cardExpirationMonth: type.string().required(),
	cardExpirationYear: type.string().required(),
	CVV: type.string().required(),
	createdAt: type.date().default(r.now()),
	updatedAt: type.date().default(r.now()),
}, {
	enforce_extra: 'remove',
	// enforce_missing: true,
});


const CartItem = thinky.createModel('CartItem', {
	id: type.string(),
	sessionId: type.string(),
	orderId: type.number().default(0),
	userId: type.string(),
	optionId: type.string(),
	shippingAddressId: type.string(),
	status: type.string().enum(['in cart', 'pending']).default('in cart'),
	createdAt: type.date().default(r.now()),
	updatedAt: type.date().default(r.now()),
}, {
	enforce_extra: 'remove',
	// enforce_missing: true,
});


const Field = thinky.createModel('Field', {
	id: type.string(),
	name: type.string(),
	value: type.string(),
	language: type.string(),
	itemId: type.string(),
	createdAt: type.date().default(r.now()),
	updatedAt: type.date().default(r.now()),
}, {
	enforce_extra: 'remove',
	// enforce_missing: true,
});


const Item = thinky.createModel('Item', {
	id: type.string(),
	title: type.string(),
	type: type.string(),
	section: type.string(),
	category: type.string(),
	createdAt: type.date().default(r.now()),
}, {
	enforce_extra: 'remove',
	pk: 'id'
	// enforce_missing: true,
});


Item.defineStatic('pager', pager);


const Option = thinky.createModel('Option', {
	id: type.string(),
	price : type.string(),
	description: type.string(),
	category: type.string(),
	itemId: type.string(),
	createdAt: type.date().default(r.now()),
	updatedAt: type.date().default(r.now()),
}, {
	enforce_extra: 'remove',
	pk: 'id'
	// enforce_missing: true,
});


Item.hasMany(Option, 'options', 'id', 'itemId');
Item.hasMany(Field, 'fields', 'id', 'itemId');


Option.belongsTo(Item, 'item', 'itemId', 'id');
Field.belongsTo(Item, 'item', 'itemId', 'id');
CartItem.belongsTo(Option, 'option', 'optionId', 'id');


module.exports = { User, TempPassword, ShippingAddress, Profiles, ContactRequests, Item, Field, Cards, Option, CartItem, Aliases };


require('./defaults')(thinky, module.exports);
