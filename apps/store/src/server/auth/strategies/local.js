'use strict';
const co = require('co');

// const passport = require('koa-passport');
const passport = require('koa-passport');
// const config = require('config');
const {User} = require('../../models');
let usernameField = 'login';
let passwordField = 'password';

let lookup = co.wrap(function* (username, password) {

	let currentUser = yield User.filter({ email: username }).limit(1);

	if (!currentUser.length) {
		return null;
	}

	currentUser = currentUser[0];
	let passwordIsValid = yield currentUser.validatePassword(password);
	if (!passwordIsValid) {
		return null;
	}

	return Object.assign({}, currentUser);
});

const {Strategy} = require('passport-local');
let localStrategy = new Strategy({
	usernameField,
	passwordField
}, function(username, password, done) {
	lookup(username, password).then(user => done(null, user)).catch(done);
});

passport.use(localStrategy);


// console.log(passport);
