'use strict';

const { login, logout, recovery, register } = require('../controllers/Auth');
const { form, redirectIfLogged, view, formSuccess } = require('../controllers/commonController');
const log = require('../logger')('router/Auth');

module.exports = router => {

	router.get('/user/logout', function* () {
		let ctx = this;
		yield* logout(ctx);
	});

	router.get('user.account.login', '/user/login.html',
		redirectIfLogged('/user/account.html', true),
		form('authorization'),
		form('registration'),
		view('user/auth')
	);

	router.post('/user/login.html',
		redirectIfLogged('/user/account.html', true),
		form('authorization', login),
		form('registration', register),
		formSuccess('user/auth', function* (ctx) {
			let {sendToCart} = ctx.session;
			ctx.redirect(sendToCart ? '/user/cart.html' : '/user/account.html');
		})
	);

	router.get('user.account.recovery', '/user/recovery.html',
		redirectIfLogged('/user/account.html', true),
		form('recovery'),
		view('user/recovery')
	);

	router.post('/user/recovery.html',
		redirectIfLogged('/user/account.html', true),
		form('recovery', recovery),
		formSuccess('user/recovery', function* (ctx) {
			yield ctx.render('user/recovery');
		})
	);

};
