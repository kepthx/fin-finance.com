/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

let userMiddleware = function* 	(next) {
	this.state.user = this.user;
	yield next;
};

let basketMiddleware = function* (next) {
	this.state.basket =  yield this.basket.list();
	yield next;
};


module.exports = koaApp => {
	koaApp.use(userMiddleware);
	koaApp.use(basketMiddleware);
};
