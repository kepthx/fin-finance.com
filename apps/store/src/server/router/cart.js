'use strict';

const marketController = require('../controllers/marketController');
const { view, loadUser } = require('../controllers/commonController');


module.exports = router => {

	router.get('user.cart', '/user/cart.html', view('cart/step_1'));

	router.post('user.cart.add','/user/cart/add', marketController.addToCart);
	router.get('user.cart.remove','/user/cart/delete/:items', marketController.deleteFromCart);


	router.get('user.cart.order-placing', '/user/cart/order-placing.html', loadUser(),  view('cart/step_2'));
	router.post('/user/cart/order_placing.html', loadUser(),  view('cart/step_2'));

	router.get('user.cart.checkout', '/user/cart/checkout.html', marketController.cartCheckoutMethod);
	router.post('/user/cart/checkout.html', marketController.cartCheckoutMethod);
};
