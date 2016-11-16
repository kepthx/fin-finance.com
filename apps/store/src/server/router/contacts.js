'use strict';

let contactsController = require('../controllers/contactsController')
const { form, redirectIfLogged, view, formSuccess } = require('../controllers/commonController');


module.exports = router => {

	router.get(
		'content.contacts', '/content/contacts.html',
		form('contacts'),
		view('pages/contacts')
	);

	router.post('/content/contacts.html',
		form('contacts', function* (ctx, next) {
			let contact = yield contactsController.store(ctx.form, ctx);
			yield contactsController.sendEmail(contact, ctx);
			yield next;
		}),
		view('pages/contacts')
	);
};
