'use strict';

const passport = require('koa-passport');
const config = require('config');


let FacebookStrategy = require('passport-facebook').Strategy
let fbStrategy = new FacebookStrategy(config.get('auth.facebook'),
	function(token, tokenSecret, profile, done) {

		console.log(token, tokenSecret, profile);
		// retrieve user ...
		done(null, adminUser)
	}
);

passport.use(fbStrategy);
