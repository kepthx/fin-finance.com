'use strict';
const marketController = require('../controllers/marketController');
const {view} = require('../controllers/commonController');

module.exports = router => {

	router.get('content.faq', '/content/faq.html', function* () {
		yield this.render('pages/faq');
	});

	router.get('content.kyc', '/content/kyc.html', function* () {
		yield this.render('pages/kyc');
	});

	router.get('content.how-to-buy', '/content/how-to-buy.html', function* () {
		yield this.render('pages/how-to');
	});

	router.get('documents.refund-policy', '/documents/refund-policy.html', function* () {
		yield this.render('pages/refund');
	});

	router.get('content.card-issue', '/content/our-services/card-issue.html', function* () {
		yield this.render('pages/ci');
	});

	router.get('content.merchant-account', '/content/our-services/merchant-account.html', function* () {
		yield this.render('pages/ma');
	});

	router.get('content.payment-service-provider', '/content/license/payment-service-provider.html', function* () {
		yield this.render('pages/psp');
	});

	router.get('content.bank-account', '/content/our-services/bank-account.html', marketController.bankAccountPage);
	router.get('content.special-offers', '/content/special-offers.html', marketController.specialOffersPage);
	router.get('content.offshore-companies', '/content/our-services/offshore-companies.html', marketController.offshorePage);



};
