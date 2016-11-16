'use strict';

const passport = require('koa-passport');
const config = require('config');

const {User} = require('../models');

passport.serializeUser((currentUser, done) =>  done(null, currentUser.id));

passport.deserializeUser((id, done) => User.get(id)
		.then(currentUser => done(null, Object.assign({}, currentUser)))
		.catch(() => done())
);

require('./strategies/local');
require('./strategies/rememberMe');

if (config.has('auth.facebook')) {
	require('./strategies/facebook');
}

if (config.has('auth.vkontakte')) {
	require('./strategies/vkontakte');
}


module.exports = koaApp => {
	koaApp.use(passport.initialize());
	koaApp.use(passport.session());
	koaApp.use(function* (next) {

		let userProperty = passport._userProperty || 'user';
		if (!this.hasOwnProperty(userProperty)) {

			Object.defineProperty(this, userProperty, {
				enumerable: true,
				get: () => {
					return this.passport[userProperty];
				},
				set: val => {
					this.passport[userProperty] = val;
				}
			});
			
		}

		yield next;
	});
};
