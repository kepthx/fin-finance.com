'use strict';

document.onclick = function (evt) {
	var tgt = (evt && evt.target) || event.srcElement,
		scr = document.body.scrollTop;

	if (tgt.tagName == 'A' && tgt.href.slice(-1) == '#') {
		window.location.href = '#';
		document.body.scrollTop = scr;
		return false;
	}
};


// const _ = require('lodash');

// window.jQuery = require('jquery');




// require('./alraa/js/jquery.formstyler.min');
require('fancybox/dist/css/jquery.fancybox.css');
// require('fancybox/dist/js/jquery.fancybox.js');

require('./alraa/css/loader.css');
require('./alraa/css/jquery.fancybox.css');
require('./alraa/css/jquery.formstyler.css');
require('./alraa/css/style.css');
require('./additional.styles.scss');

// window.jQuery = require('jquery-migrate');
// const logger = require('../libs/logger')('web/front');

// const websocketServer = require('../libs/ws');
// const ws = new websocketServer();

// const angular = require('angular');
// const cookies = require('angular-cookies');
// const frontendApp = angular.module('fintech.store.front', [cookies]);
// const $fancybox = window.jQuery('.fancybox');
// window.jQuery('.fancybox');

const qs = require('qs');
const serialize = require('form-serialize');
// const initPage = require('./initPage');
// const Promise = require('bluebird');

let startSend;
let testTimer = setInterval(function () {
	if (startSend) {
		ws.send('hi');
	}
}, 53300);

ws.on('open', function (server) {
	startSend = true;
	ws.send('hi');

});






frontendApp.config(['$provide', function() {
    // $provide.decorator('$log', function($delegate) {
	// 	return logger;
    // });
}]);

frontendApp.run(['$rootScope', function ($rootScope) {

	$rootScope.$safeApply = function(fn) {

		let phase = this.$root.$$phase;
		if (phase == '$apply' || phase == '$digest') {
			return fn ? fn() : null;
		}

		this.$apply(fn);
	};
}]);

frontendApp.directive('shoppingCart', ['$rootScope', function ($rootScope) {
	return {
		restrict: 'AC',
		link: function ($scope, $element/*, attr*/) {

			let element = $element[0];
			let totalItemsCounter = element.getElementsByClassName('basket-counter')[0];
			$rootScope.$on('cart:update', function ($event, basketData) {
				totalItemsCounter.innerHTML = basketData.items.length;
			});
		}
	};
}]);




//
// frontendApp.service('$heights', ['$rootScope', function ($rootScope) {
// 	let heightsList = {};
// 	let me = this;
//
//
// 	this.setMaxHeight = function (blockID, height) {
//
// 		let blockIdExists = blockID in heightsList;
// 		let currentBlockHeight = blockIdExists
// 			? parseInt(heightsList[blockID])
// 			: 0;
// 		return currentBlockHeight;
// 	}
//
// 	this.applyMaxHeight = function (blockId, height) {
//
// 		let currentBlockHeight = me.setMaxHeight(blockId, height);
// 		if (height > currentBlockHeight) {
// 			heightsList[blockId] = height;
// 			console.log(heightsList);
// 			$rootScope.$broadcast('heights::set', blockId, height);
// 		}
// 	}
//
// 	this.resetHeights = function (blockId) {
// 		heightsList = {};
// 	}
//
// }]);
//
// frontendApp.directive('sameHeight', ['$rootScope', '$heights', function ($rootScope, $heights) {
//
// 	let getHeight = function ($element) {
// 		let prevMinHeight = $element.css('min-height').replace('px', '');
// 		prevMinHeight = parseInt(prevMinHeight);
//
// 		console.log('prev min height', prevMinHeight);
// 		$element.css({'min-height' : 0});
// 		let result = $element[0].offsetHeight;
//
// 		if (prevMinHeight && prevMinHeight !== 0) {
// 			console.log('set min height');
// 			$element.css({'min-height' : prevMinHeight});
// 		}
//
// 		return result;
// 	}
//
// 	let heightIsEqual = function ($element, height) {
// 		return getHeight($element) === height;
// 	}
//
// 	let setHeight = function ($element, $offsetBottomElement, blockId) {
//
// 		let currentHeight = getHeight($element);
//
// 		let currentOffsetHeight = getHeight($offsetBottomElement) ;
// 		console.log(currentOffsetHeight, $offsetBottomElement[0]);
// 		let tempOffset = currentOffsetHeight- 73;
// 		currentOffsetHeight = tempOffset > 0 ? tempOffset : 0;
//
//
// 		// debugger;
//
//
// 		let maxHeight = $heights.applyMaxHeight(blockId, currentHeight + currentOffsetHeight);
// 	}
//
// 	global.jQuery(window).on('load', function () {
// 		$rootScope.$broadcast('heights::update');
// 	});
//
// 	global.jQuery(window).on('resize', function () {
// 		$rootScope.$broadcast('heights::update');
// 		$heights.resetHeights();
// 		console.log('--------------------------------------------');
// 	});
//
// 	return {
// 		restrict: 'A',
// 		link: function ($scope, $element, elementAttributes) {
//
// 			let $offsetBottomElement = $element.find('.box-grid__line-ptice');
//
// 			console.log($offsetBottomElement);
//
// 			let blockId = elementAttributes.sameHeight;
// 			setHeight($element, $offsetBottomElement, blockId);
// 			$scope.$on('heights::update', function (event) {
// 				setHeight($element, $offsetBottomElement, blockId);
// 			});
//
// 			$scope.$on('heights::set', function (event, currentBlockId, height) {
// 				console.log('before', $element[0], currentBlockId, blockId, 'height', height, 'currentElementHeight', getHeight($element));
//
// 				if (currentBlockId === blockId) {
// 					console.log('SET');
// 					$element.css({'min-height': height });
// 				}
// 				console.log('after', $element[0], currentBlockId, 'height', height, 'currentElementHeight', getHeight($element));
//
// 			});
//
// 		}
// 	};
// }]);



frontendApp.directive('withDrop', ['$rootScope', function () {
	return {
		restrict: 'AC',
		link: function ($scope, $element/*, attr*/) {
			$element.on('click', function (event) {
				if (angular.element(event.target).attr('href') === '#') {
					event.preventDefault();
					return false;
				}
			});
		}
	};
}]);


frontendApp.directive('removeFromCart', ['$rootScope', '$http', function ($rootScope, $http) {

	return {
		restrict: 'AC',
		link: function ($scope, $element/*, attr*/) {

			$element.on('click', function (event) {

				let href = angular.element(this).attr('href');
				let itemId = angular.element(this).attr('data-item-id');

				$http.get(href + '?isRpcMethod=true').then(function (info) {
					$rootScope.$broadcast('cart:remove', itemId);
					$rootScope.$broadcast('cart:update', info.data.basket);
				});

				event.preventDefault();
				return false;

			});

			// $element.on('click', function (event) {
			// 	if (angular.element(event.target).attr('href') === '#') {
			// 		event.preventDefault();
			// 		return false;
			// 	}
			// });
		}
	};

}]);


// frontendApp.directive('cartItem', ['$rootScope', '$http', function ($rootScope, $http) {  // eslint-disable-line
// 	let elements = {};
//
// 	$rootScope.$on('cart:remove', function (event, itemId) {
// 		// console.log(itemId);
// 		elements[itemId].remove();
// 		delete elements[itemId];
// 	});
//
// 	return {
// 		restrict: 'AC',
// 		link: function ($scope, $element, attr) {
// 			elements[attr.cartItem] = $element;
// 		}
// 	};
//
// }]);


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

function initLanguage(langCode) {


	return new Promise(function (resolve, reject) {
		if (currentLanguageCode in currentLanguagePhrases) {
			return resolve(true);
		}

		global.jQuery.getJSON('/locales/' + langCode + '.js').then(function (data) {
			currentLanguagePhrases[currentLanguageCode] = data;
			resolve(true);
		}).catch(reject);
	});
}

currentLanguageCode = document.documentElement.lang;
initLanguage(currentLanguageCode);


frontendApp.directive('storeCart', ['$rootScope', '$compile',  function ($rootScope, $compile) {

	let $cartElement;

	$rootScope.$on('cart:update', function (event, basketData) {
		// console.log(basketData);

		// onlyCartTemplate()
		if ($cartElement) {

			let data = _.assign({}, {basket: basketData}, templateLocals);
			data.total = basketData.total;
			data.language = basketData.language;

			basketData.total === 0
				? $cartElement.addClass('empty-cart')
				: $cartElement.removeClass('empty-cart');

			initLanguage(currentLanguageCode).then(function () {

				let html = onlyCartTemplate(data);
				let child = $rootScope.$new();
				$cartElement.html(html);
				$compile($cartElement.contents())(child);
			});

		}
	});

	return {
		restrict: 'AC',
		link: function ($scope, $element, attr) {  // eslint-disable-line
			$cartElement = $element;

			// $element.on('click', function (event) {
			// 	if (angular.element(event.target).attr('href') === '#') {
			// 		event.preventDefault();
			// 		return false;
			// 	}
			// });
		}
	};
}]);





// let languages = {
// 	de : 'ger',
// 	en : 'eng',
// 	ru : 'rus',
// 	es : 'esp',
// };
//
// frontendApp.directive('boxLanguage', function ($rootScope, $http) {
// 	return {
// 		restrict: 'AC',
// 		link: function ($scope, $element, attr) {
//
// 			let $body = angular.element(document.body);
//
// 			$element.find('.list-languages__link').on('click', function (event) {
//
// 				let href = angular.element(this).attr('href');
// 				if (href && href.length && href !== '#') {
// 					let args = qs.parse(href.replace(/[^?]+[?]/gim, ''));
// 					if ('lang' in args) {
// 						let currentLanguage = args['lang'];
// 					}
//
// 					href = href + '&layout=simple';
// 					$body.addClass('loaded');
// 					$http.get(href).then(function (result) {
// 						$body.removeClass('loaded');
//
// 						console.log(result.data);
// 						// document.body.innerHTML = result.data;
// 						// setTimeout(function () {
// 						// 	initPage(global.jQuery);
// 						// }, 10);
// 					});
//
// 					event.preventDefault();
// 					return false;
// 				}
//
// 				event.preventDefault();
// 				return false;
// 			});
// 		}
// 	};
// });







frontendApp.directive('cookiesMessage', ['$rootScope', '$cookies', '$cookieStore', function ($rootScope, $cookies/*, $cookieStore*/) {

	return {
		restrict: 'AC',
		link: function ($scope, $element) {

			$element.on('click', function (event) {

				if (angular.element(event.target).hasClass('cookie-agree')) {

					$cookies.putObject('cookiesSettings', {
						isEnabled: true
					});

					$element.hide();
				}

				event.preventDefault();
				return false;
			});
		}
	};
}]);




frontendApp.controller('storefrontController', ['$rootScope', function (/*$rootScope*/) {

}]);


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

	return result == 0 ? '' : '€ ' + formatNumber(result);
}

// function getFormValues(form) { //TODO
// 	let result = {};
//
// 	for (var i = 0; i < form.elements.length; i++) {
//
// 	}
//
// 	return result;
// }

// let $addToCart = window.jQuery('.add-to-cart-message');
// $addToCart.on('click', function (/*event*/) {
// 	window.jQuery(this).addClass('hide');
// });

frontendApp.directive('storefront', ['$http', '$rootScope', function ($http, $rootScope) {
	return {
		restrict: 'AC',
		link: function ($scope, $element) {

			let form = $element[0];

			$scope.$safeApply(function () {
				$scope.totalPrice = getFullPrice(form.elements);
			});

			$element.on('change', function () {
				$scope.$safeApply(function () {
					$scope.totalPrice = getFullPrice(form.elements);
				});
			});

			$element.on('submit', function (event) {

				let values = serialize(form);
				values = qs.parse(values);

				values['isRpcMethod'] = true;
				$http[form.method](form.action, values)
					.then(function(result){
						let data = {};
						if ('data' in result) {
							data = result.data;
						}

						$rootScope.$broadcast('cart:update', data.basket);
					})
					.catch(function (e) {
						// logger.error(e);
					})
					.then(function () {
						// form.reset();

						for (var i = 0; i < form.elements.length; i++) {
							let currentElement = form.elements[i], $currentElement = angular.element(currentElement);
							if (currentElement.checked) {
								// console.log($currentElement.parent());
								$currentElement.parent().trigger('click');
							}
						}

						$addToCart.removeClass('hide');
						setTimeout(function () {
							$addToCart.addClass('hide');
						}, 500);

						window.jQuery.fancybox.close();
					});

				event.preventDefault();
				return false;
			});
		}
	};
}]);

// initPage(global.jQuery);
