'use strict';
const config = require('config');
const controllers = require('../../controllers');
const serve = require('koa-static');


module.exports = router => {
	let adminLink = config.get('admin.link');
	console.log(adminLink);
	router.get('admin.dashboard.home', adminLink, serve('./public/html', {}));
};
