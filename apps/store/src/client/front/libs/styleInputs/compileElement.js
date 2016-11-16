'use strict';

const {attributesToString, makeHtml, copyAttributes} = require('../../libs/transform');


module.exports = (elementTemplate, element, styleOptions = {}) => {
	let styledElement;
	styledElement = makeHtml(elementTemplate);
	copyAttributes(element, styledElement, styleOptions);

	element.parentNode.insertBefore(styledElement, element.nextSibling);
	styledElement.insertBefore(element, styledElement.firstChild);

	if (element.disabled) {
		styledElement.classList.add('disabled');
	}

	return styledElement;
};
