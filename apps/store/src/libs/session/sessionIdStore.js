'use strict';

const {crc32} = require('crc');


let sessionIdStoreFactory = function (key, cookie, session) {
	return {
		get: function() {
			return this.cookies.get(key, cookie);
		},

		set: function(sid, session) {
			this.cookies.set(key, sid, session.cookie);
		},

		reset: function() {
			this.cookies.set(key, null);
		}
    }
}


/**
 * cookie use maxage, hack to compat connect type `maxAge`
 */
function compatMaxage(opts) {
  if (opts) {
    opts.maxage = opts.maxage === undefined
      ? opts.maxAge
      : opts.maxage;
    delete opts.maxAge;
  }
}

/**
 * get the hash of a session include cookie options.
 */
function hash(sess) {
  return crc32.signed(JSON.stringify(sess));
}

/**
 * generate a new session
 */
 let generateSessionFactory = cookie => {
	 return () => {
		 let session = {};
		 //you can alter the cookie options in nexts
		 session.cookie = {};
		 for (let prop in cookie) {
			 session.cookie[prop] = cookie[prop];
		 }

		 compatMaxage(session.cookie);
		 return session;
	 }
 }

module.exports = {sessionIdStoreFactory, hash, generateSessionFactory, compatMaxage};
