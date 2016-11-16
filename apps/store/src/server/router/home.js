'use strict';

const commonController = require('../controllers/commonController');


module.exports = router => {
	router.get('front', '/index.html', commonController.redirect('/', 301));
	router.get('/', commonController.view('home', {page_class: 'index'}));
};
