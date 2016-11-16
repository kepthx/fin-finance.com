'use strict';

const passport = require('koa-passport');
const config = require('config');


const {Strategy} = require('passport-remember-me');


let tokens = {};

let consumeToken = function(token, done) {
	let uid = tokens[token];
	// invalidate the single-use token
	delete tokens[token];
	return done(null, uid);
};

let saveToken = function(token, uid, done) {
	tokens[token] = uid;
	return done();
};


let rememberMeStrategy = new Strategy(consumeToken, saveToken);
passport.use(rememberMeStrategy);
