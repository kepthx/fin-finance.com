'use strict';

const qwery = require('qwery');
const {slide, onInterval} = require('../libs/transform');

let scrollToObject = {
	type : 'scroll'
};

module.exports = function () {

	let allTogglers = qwery('.list-sections-faq__link, .list-faq__link');
	let topLevelTogglers = qwery('.list-sections-faq__link');

	document.body.addEventListener('click', function (event) {

		let isToggler = allTogglers.indexOf(event.target) >= 0;
		if (!isToggler) {
			return ;
		}

		let scrollTo = 0;


		let toggler = event.target;
		let isTopToggler = toggler.className.indexOf('list-sections-faq__link') >= 0;

		let dropdownSelector = isTopToggler ? '.list-faq' : '.list-faq__drop';
		let [dropdown] = qwery(dropdownSelector, toggler.parentNode);
		if (dropdown) {
			toggler.parentNode.classList.toggle('open', slide(dropdown, 'toggle'));
		}

		let currentTogglers = isTopToggler
			? topLevelTogglers
			: toggler.parentNode.parentNode.children;

		let togglersCount = currentTogglers.length;
		let sameToggler = isTopToggler
			? toggler
			: toggler.parentNode;

		while (togglersCount--) {
			let nextToggler = currentTogglers[togglersCount];
			if (nextToggler === sameToggler) {
				continue;
			}

			// let elementWithClassOpen = isTopToggler
			// 	? nextToggler.parentNode
			// 	: nextToggler;

			// if (nextToggler && elementWithClassOpen.className.split(' ').indexOf('open') >= 0) {
			// 	let [togglerDropdown] = qwery(isTopToggler ? '.list-faq' : '.list-faq__drop', elementWithClassOpen);
			// 	if (togglerDropdown){
			// 		togglerDropdown.parentNode.classList.toggle('open', slide(togglerDropdown, 'toggle'));
			// 	}
			// }
		}


		event.preventDefault();
	});


};
