'use strict';
const { form, redirectIfLogged, view, formSuccess } = require('../controllers/commonController');
const accountController = require('../controllers/accountController');
const marketController = require('../controllers/marketController');



module.exports = router => {


	router.get('user.account', '/user/account.html',
		redirectIfLogged('/user/login.html', false),
		accountController.index
	);

	router.get(
		'user.account.edit',
		'/user/account/documents.html',
		redirectIfLogged('/user/login.html', false),
		form('documents'),
		view('account/documents')
	);

	router.post(
		'/user/account/documents.html',
		form('documents'),
		view('account/documents')
	);

	router.get(
		'user.account.edit',
		'/user/account/edit.html',
		redirectIfLogged('/user/login.html', false),
		accountController.editFormShow
	);

	router.post(
		'/user/account/edit.html',
		accountController.edit
	);


	router.get(
		'user.account.change-password',
		'/user/account/change-password.html',
		redirectIfLogged('/user/login.html', false),
		form('change_password'),
		view('account/change_password')
	);

	router.get('user.account.changePasswordByToken', '/user/change-password/:resetToken',
		form('change_password'),
		accountController.changePasswordByToken,
		view('account/change_password')
	);

	router.post(
		'/user/account/change-password.html',
		redirectIfLogged('/user/login.html', false),
		form('change_password', accountController.changePassword),
		formSuccess('account/change_password', function* (ctx, next) {
			ctx.session.flash = 'Password changed successfully';
			ctx.redirect('/user/account.html');
		})
	);

	router.get(
		'user.account.resend-confirmation',
		'/user/account/resend-confirmation.html',
		redirectIfLogged('/user/login.html', false),
		accountController.resendConfirmation
	);

	router.get(
		'user.account.confirmation',
		'/user/account/confirmation/:activationToken',
		accountController.confirmAccount
	);

	router.get(
		'user.account.details', '/user/account/details.html',
		// commonController.redirectIfLogged('/user/login.html', false),
		function* () {
			yield this.render('account/details');
		}
	);

	router.get(
		'user.account.orders',
		'/user/account/orders.html',
		redirectIfLogged('/user/login.html', false),
		marketController.ordersHistory
	);

	router.get(
		'user.account.history',
		'/user/account/history.html',
		redirectIfLogged('/user/login.html', false),
		function* () {
			yield this.render('account/history');
		}
	);

};
