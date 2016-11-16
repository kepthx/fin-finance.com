'use strict';

require('fancybox/dist/css/jquery.fancybox.css');
require('./alraa/css/loader.css');
require('./alraa/css/jquery.fancybox.css');
require('./alraa/css/jquery.formstyler.css');
require('./alraa/css/style.css');
require('./additional.styles.scss');

require('classlist-polyfill');
require('weakmap-polyfill');

require('./libs/ie8');
// require('js-polyfills');
require('focusin').polyfill();

const qs = require('qs');
const serialize = require('form-serialize');
const validate = require('validate.js');
const domready = require('domready');
const qwery = require('qwery');
const http = require('nanoajax');
const MicroEvent = require('microevent');
const Cookies = require('js-cookie');
const fancybox = require('./app/fancybox');

let app = function () {}

MicroEvent.mixin(app);
let appInstance = new app();

require('./app/init');

let [basketCounter] = qwery('.shopping-cart .basket-counter');
appInstance.bind('cart:update', function (basketData) {
	if (basketCounter) {
		basketCounter.innerHTML = basketData.items.length;
	}
});


let bindCartEvents = function(context = document.body) {

	let removeFromCartBtn = qwery('.remove-from-cart', context);
	let removeFromCartBtnCount = removeFromCartBtn.length;
	while (removeFromCartBtnCount--) {
		let currentButton = removeFromCartBtn[removeFromCartBtnCount];
		currentButton.addEventListener('click', function (event) {
			let url = currentButton.getAttribute('href') + '?isRpcMethod=true';
			let itemId = currentButton.getAttribute('data-item-id');

			http.ajax({url}, function (code, responseText) {
				let basketData = JSON.parse(responseText);
				appInstance.trigger('cart:remove', itemId);
				appInstance.trigger('cart:update', basketData.basket);
			});

			event.preventDefault();
		});
	}
};


let numberWithCommas = x => {
	x = x || 0;
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const onlyCartTemplate = require('../../views/cart/only_cart.pug');

let routes = {
	'user.cart.remove' : function (itemdId) {
		return '/user/cart/delete/' + itemdId;
	}
};



let currentLanguagePhrases = {};
let currentLanguageCode = 'en';

let templateLocals = {
	'__' : function (str) {

		if (currentLanguageCode in currentLanguagePhrases && str in currentLanguagePhrases[currentLanguageCode]) {
			str = currentLanguagePhrases[currentLanguageCode][str];
		}

		return str;
	},

	helpers : {
		url : function (linkId, itemId) {
			if (linkId in routes) {
				return routes[linkId](itemId);
			}
		},

		stringify : obj => JSON.stringify(obj),
		formatPriceItem : item => '€ ' + numberWithCommas(item.price),
		formatPrice : price => '€ ' + numberWithCommas(price),
		activeCartStep: (activeStep, currentStep) => parseInt(currentStep) <= parseInt(activeStep) ? 'active' : ''
	}
};

let noop = function(){};
function initLanguage(langCode, done = noop) {
	if (currentLanguageCode in currentLanguagePhrases) {
		return done(null, true);
	}

	let url = '/locales/' + langCode + '.js';
	http.ajax({url}, function (code, responseText) {
		try {
			let data = JSON.parse(responseText);
			currentLanguagePhrases[currentLanguageCode] = data;
			done(null, true);
		} catch (error) {
			done(error, false);
		}
	});
}

currentLanguageCode = document.documentElement.lang;
initLanguage(currentLanguageCode);


let [storeCart] = qwery('.store-cart');

if (storeCart) {
	bindCartEvents(storeCart);
}

appInstance.bind('cart:update', function (basketData) {
	if (!storeCart) {
		return ;
	}

	let data = Object.assign({}, {basket: basketData}, templateLocals);
	data.total = basketData.total;
	data.language = basketData.language;
	storeCart.classList.toggle('empty-cart', basketData.total === 0);
	data.user = document.body.className.split(' ').indexOf('logged') >= 0;

	initLanguage(currentLanguageCode, function (err) {
		if (err) {
			console.error(err);
		}

		let html = onlyCartTemplate(data);
		storeCart.innerHTML = html;
		bindCartEvents(storeCart);
	});
});



let [cookiesMessage] = qwery('.cookies-message');
if (cookiesMessage) {
	cookiesMessage.addEventListener('click', function (event) {
		let itsAgreeButton = event.target.className.split(' ').indexOf('cookie-agree') >= 0;
		if (itsAgreeButton) {
			let currentdate = new Date();
			let expirationTime = currentdate.getTime() + (10 * 365 * 24 * 60 * 60);
			Cookies.set('cookiesSettings', {isEnabled: true}, {expires: expirationTime});
			cookiesMessage.style.display = 'none';
		}
		event.preventDefault();
	});
}

let formatNumber = function name(str) {
	str = '' + str;
	return str.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

function getFullPrice(formElements) {

	let result = 0;

	for (let i = 0; i < formElements.length; i++) {
		let currentElement = formElements[i]
			// , $currentElement = angular.element(currentElement)
			;
		if (currentElement.checked || ['hidden'].indexOf(currentElement.type) >= 0) {
			let currentPrice = currentElement.getAttribute('data-price');
			result += parseFloat(currentPrice);
		}
	}

	result = result == 0 ? '' : '€ ' + formatNumber(result);
	return result;
}


let storefronts = qwery('.storefront');
let storefrontsCount = storefronts.length;

function setPrice(priceElement, priceValue = null) {
	if (priceValue === null ) {
		priceValue = '';
	}
	priceElement.innerHTML = priceValue;
}


let [addToCartMessage] = qwery('.add-to-cart-message');
document.addEventListener('submit', function (event) {
	if (storefronts.indexOf(event.target) >= 0) {
		let currentForm = event.target;
		let body = serialize(currentForm);
		let method = currentForm.method;
		let url = currentForm.action;

		body = qs.parse(body);
		body['isRpcMethod'] = true;
		body = qs.stringify(body);

		if (method === 'GET') {
			url = url + '?' + body;
		}

		http.ajax({url, method, body}, function (code, responseText) {
			let basketData = JSON.parse(responseText);
			appInstance.trigger('cart:update', basketData.basket);

			for (var i = 0; i < currentForm.elements.length; i++) {
				let currentElement = currentForm.elements[i];
				if (currentElement.checked) {
					currentElement.checked = false;
					let changeEvent = new Event('change');
					currentElement.dispatchEvent(changeEvent);
				}
			}

			if (addToCartMessage){
				fancybox.close();
				addToCartMessage.classList.remove('hide');
				setTimeout(function () {
					addToCartMessage.classList.add('hide');
				}, 500);
			}
		});

		event.preventDefault();
	}
});

while (storefrontsCount--) {

	let currentStoreFront = storefronts[storefrontsCount];
	let [priceElement] = qwery('.popup__price', currentStoreFront);
	if (priceElement) {
		setPrice(priceElement, getFullPrice(currentStoreFront.elements));
	}

	currentStoreFront.addEventListener('change', function () {
		setPrice(priceElement, getFullPrice(currentStoreFront.elements));
	});
}


document.addEventListener('click', function (event) {
	let tgt = (event && event.target) || event.srcElement;
	if (tgt.tagName.toLowerCase() == 'a' && tgt.href.slice(-1) == '#' && tgt.className.split(' ').indexOf('menu__link') >= 0) {
		event.preventDefault();
		return false;
	}
});

// require('./angularApp');
