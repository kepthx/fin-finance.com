/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';
const fs = require('fs');
const serve = require('koa-static');


/**
 * Controller for admin dashboard page
 * @return {undefined}
 */
function* dashboard (next) {
	// this.type = 'html';
	// this.body = fs.createReadStream('public/html/dashboard.html');

	let middleWare = serve('./public/html/admin/dist');
	middleWare = middleWare.bind(this, next);
	yield * middleWare();
}


module.exports = {dashboard};
