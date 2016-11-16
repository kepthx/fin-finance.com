'use strict';

const {getOptions, getSearchOptions} = require('../options');
const {attributesToString, makeHtml, copyAttributes} = require('../../../libs/transform');
const qwery = require('qwery');
const compileElement = require('../compileElement');


let isiOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/i) && !navigator.userAgent.match(/(Windows\sPhone)/i)) ? true : false;
let isAndroid = (navigator.userAgent.match(/Android/i) && !navigator.userAgent.match(/(Windows\sPhone)/i)) ? true : false;


let disableScrollingListener = function (event) {

	let scrollTo = null;
	switch (true) {
	case event.type == 'mousewheel':
		scrollTo = (event.wheelDelta * -1);
		break;
	case event.type == 'DOMMouseScroll':
		scrollTo = 40 * event.detail;
		break;
	}

	if (scrollTo) {
		event.stopPropagation();
		event.preventDefault();
		this.scrollTop = scrollTo + this.scrollTop;
	}
};


let preventScrolling = elements => {
	let elementsCount = elements.length;
	while (elementsCount--) {
		let element = elements[elementsCount];
		element.removeEventListener('mousewheel', disableScrollingListener);
		element.removeEventListener('DOMMouseScroll', disableScrollingListener);
		element.addEventListener('mousewheel', disableScrollingListener);
		element.addEventListener('DOMMouseScroll', disableScrollingListener);
	}
};


let generateOptionsList = (optionsList, styleOptions) => {

	let stringOptionsList = [];
	for (let i = 0; i < optionsList.length; i++) {

		let currentOption = optionsList[i];

		let classList = '';
		if (currentOption.parentNode.selectedIndex === i) {
			classList = classList + ' selected sel';
		}

		if (currentOption.disabled) {
			classList = classList + ' disabled';
		}

		let overridedAttributes = {class: classList};
		if (currentOption.className && currentOption.className.length) {
			overridedAttributes['data-jqfs-class'] = currentOption.className;
		}

		if (currentOption.parentNode.tagName.toLowerCase() === 'optgroup') {
			overridedAttributes['class'] += ' option';

			let optGroupClasses = currentOption.parentNode.className && currentOption.parentNode.className.length
				? currentOption.parentNode.className
				: '';

			if (optGroupClasses.length) {
				overridedAttributes['class'] += ' ' + optGroupClasses;
			}

			if (currentOption.parentNode.firstChild === currentOption) {
				stringOptionsList.push(`<li class="optgroup ${optGroupClasses}">${ currentOption.parentNode.getAttribute('label') }</li>`);
			}
		}

		if (i === 0 && currentOption.innerHTML.trim() === '' && !currentOption.parentNode.hasAttribute('placeholder')) {
			overridedAttributes['style'] = 'display: none;';
		}

		let optionAttrs = attributesToString(currentOption, overridedAttributes, styleOptions);
		stringOptionsList.push(`<li ${ optionAttrs.trim() }>${ currentOption.innerHTML }</li>`);
	}

	return stringOptionsList;
};


document.body.addEventListener('click', function (event) {
	let openedItems = qwery('.jq-selectbox.opened');
	let openedCount = openedItems.length;
	while (openedCount--) {
		let item = openedItems[openedCount];
		item.classList.remove('opened');
		let [dropdownMenu] = qwery('.jq-selectbox__dropdown', item);
		dropdownMenu.style.display = 'none';
	}
});


let makeSelect = function (element, styleOptions = {}) {

	let optionsList = qwery('option', element);
	let stringOptionsList = generateOptionsList(optionsList, styleOptions);

	let placeholder = element.getAttribute('placeholder');

	let searchOptions = getSearchOptions(styleOptions, element);
	let searchTemplate = searchOptions.enable
		? `
			<div ${stringOptionsList.length ? '' : 'style="display: none;"'} class="jq-selectbox__search">
				<input type="search" autocomplete="off" placeholder="${ searchOptions.placeholder }">
			</div>
			<div style="display: none;" class="jq-selectbox__not-found">${ searchOptions.notFound }</div>
		`
		: '';

	let placeholderText = optionsList[element.selectedIndex].innerHTML.trim();
	placeholderText = placeholderText === '' ? placeholder : placeholderText;

	let template = `
		<div class="jq-selectbox jqselect">
			<div class="jq-selectbox__select" style="position: relative">
				<div class="jq-selectbox__select-text ${ placeholderText === placeholder ? 'placeholder' : '' }">
					${ placeholderText || '' }
				</div>
				<div class="jq-selectbox__trigger">
					<div class="jq-selectbox__trigger-arrow"></div>
				</div>
				<div class="jq-selectbox__dropdown" style="position: absolute; display: none;">
					${ searchTemplate }
					<ul style="position: relative; list-style: none; overflow: auto; overflow-x: hidden">
						${ stringOptionsList.join('') }
					</ul>
				</div>
			</div>
		</div>
	`;

	let styledElement = compileElement(template, element, styleOptions);

	styledElement.style.display = 'inline-block';
	styledElement.style.position = 'relative';
	styledElement.style.zIndex = styleOptions.singleSelectzIndex;

	element.style.margin = 0;
	element.style.padding = 0;
	element.style.position = 'absolute';
	element.style.left = 0;
	element.style.top = 0;
	element.style.width = '100%';
	element.style.height = '100%';
	element.style.opacity = 0;

	if (element.disabled) {
		return false;
	}


	let [dropdownToggler] = qwery('.jq-selectbox__select', styledElement);
	let [dropdownMenu] = qwery('.jq-selectbox__dropdown', styledElement);
	let [selectPlaceholder] = qwery('.jq-selectbox__select-text', styledElement);
	dropdownToggler.addEventListener('click', function (event) {

		if (styledElement.className.indexOf('opened') >= 0) {
			let event = new CustomEvent('close', {});
			element.dispatchEvent(event);
		}

		element.focus();

		if (isiOS) {
			return ;
		}

		let isValidSelector = event.target.hasAttribute('value')
			&& event.target.className.indexOf('disabled') < 0
			&& event.target.className.indexOf('optgroup') < 0
		;

		if (isValidSelector) {
			element.value = event.target.getAttribute('value');
			selectPlaceholder.innerHTML = event.target.innerHTML;
		}

		styledElement.classList.toggle('opened');
		dropdownMenu.style.display = styledElement.className.indexOf('opened') >= 0
			? null : 'none';

		event.preventDefault();
		event.stopPropagation();
	});

};

module.exports = function (element, styleOptions = {}) {
	styleOptions = getOptions(styleOptions);
	makeSelect(element, styleOptions);
};
