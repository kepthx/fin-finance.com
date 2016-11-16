'use strict';

const passport = require('koa-passport');
const config = require('config');

let tempUser = {};

// {
// 	clientID:     VKONTAKTE_APP_ID, // VK.com docs call it 'API ID', 'app_id', 'api_id', 'client_id' or 'apiId'
//     clientSecret: VKONTAKTE_APP_SECRET,
//     callbackURL:  "http://localhost:3000/auth/vkontakte/callback"
//   }
let VKontakteStrategy = require('passport-vkontakte').Strategy;
let vkStrategy = new VKontakteStrategy(config.get('auth.vkontakte'),
	function(token, tokenSecret, profile, done) {

		// console.log(token, tokenSecret, profile);
		// retrieve user ...
		done(null, tempUser);
	}
);

passport.use(vkStrategy);
