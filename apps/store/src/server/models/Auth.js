'use strict';

const thinky = require('./db');
const {type, r} = thinky;
const uuid = require('uuid');
const config = require('config');
const pager = require('./pager');
const {hookWrapper} = require('./util');
const bcrypt = require('bcrypt');
const promisifyFabric = require('../../libs/promisifyFabric');

let genSalt = promisifyFabric(bcrypt.genSalt);
let hash = promisifyFabric(bcrypt.hash);
let compare = promisifyFabric(bcrypt.compare);

const Auth = thinky.createModel('User', {
	id: type.string(),
	email: type.string().min(3).max(100).email().required(),
	password: type.string().min(3).max(100).required(),
	language: type.string().max(100).default('en'),
	activationToken: type.string().min(3).max(100).default(() => uuid.v4()).allowNull(true),
	resetToken: type.string().min(3).max(100).allowNull(true),
	isAdmin: type.boolean().default(false),
	createdAt: type.date().default(r.now()),
	updatedAt: type.date().default(r.now()),
}, {
	enforce_extra: 'remove',
	// enforce_missing: true,,
	// pk: 'email'
});


// Auth.docAddListener('save', function (authInfo) {
// 	console.log('SAVE', authInfo);
// });


// let timeoutPromise = timeout => new Promise(resolve => setTimeout(resolve, timeout));


Auth.defineStatic('pager', pager);

let calculatePasswordHash = function* (originalPassword) {
	let salt = yield genSalt(config.get('user.salt_round'));
	let currentHash = yield hash(originalPassword, salt);

	return currentHash;
}

Auth.pre('save', hookWrapper(function* () {
	let isNew = !this.isSaved();
	if (isNew) {
		this.password = yield* calculatePasswordHash(this.password);
	}
}));

// Auth.post('save', hookWrapper(function* () {
//
// }));

Auth.define('validatePassword', function* (password) {
	let isSame =  yield compare(password, this.password);
	return isSame;
});


Auth.define('changePassword', function* (newPassword) {
	this.password = yield* calculatePasswordHash(newPassword);
	yield this.save();
});






// Auth.docAddListener('saving', function (authInfo) {
// 	// console.log('saving ', authInfo);
// 	console.log('saving ');
// 	return timeoutPromise(1000).then(r => console.log('end'));
// });
//
// Auth.docAddListener('saved', function (authInfo) {
// 	// console.log('saved', authInfo);
// 	console.log('saved');
// });
//
// Auth.docAddListener('delete', function (authInfo) {
// 	console.log('delete', authInfo);
// });


Auth.ensureIndex('createdAt');
Auth.ensureIndex('email');



module.exports = Auth;
