'use strict';

/**
 *
 * Documents section
 *
 **/

module.exports = router => {

	router.get('documents.privacy', '/documents/privacy-policy.html', function* () {
		yield this.render('documents/privacy');
	});

	router.get('documents.terms-of-business', '/documents/terms-of-business.html', function* () {
		yield this.render('documents/business');
	});


	router.get('documents.terms-of-use', '/documents/terms-of-use.html', function* () {
		yield this.render('documents/use');
	});

};
