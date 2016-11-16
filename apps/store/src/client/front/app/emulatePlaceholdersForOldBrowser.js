'use strict';

const qwery = require('qwery');
const detectBrowser = require('../../libs/detect-browser');

module.exports = function () {
	let inputWithPlaceholders = qwery('input, textarea');
	if (detectBrowser.msie) {
		let totalInputs = inputWithPlaceholders.length;
		while (totalInputs--) {
			let currentInput = inputWithPlaceholders[totalInputs];
			currentInput.value = currentInput.getAttribute('placeholder');
		}

		document.body.addEventListener('focus', function (event) {
			if (event.target.value === event.target.getAttribute('placeholder')) {
				event.target.value = '';
			}
		}, true);

		document.body.addEventListener('blur', function (event) {
			let placeholder = event.target.getAttribute('placeholder');
			if (event.target.value === '') {
				event.target.value = placeholder;
			}
		}, true);
	}
};
