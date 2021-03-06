'use strict';

let timersList = new WeakMap();

//TODO https://developer.mozilla.org/ru/docs/DOM/window.requestAnimationFrame
let onInterval = function (checkIsFinish, element, interval) {

	let prevTimer = timersList.get(element);
	if (prevTimer) {
		window.clearInterval(prevTimer);
	}

	let timer = window.setInterval(function () {
		if (checkIsFinish()) {
			window.clearInterval(timer);
			timersList.delete(element, timer);
		}
	}, interval);

	timersList.delete(element);
	timersList.set(element, timer);
};

let slide = function (element, type, ms = 300) {

	let isHidden = ['none', ''].indexOf(element.style.display) >= 0
		|| !(element.className.split(' ').indexOf('in') >= 0);

	if (type === 'toggle' || !type) {
		type = isHidden ? 'in' : 'out';
	}

	let isIn = type === 'in',
		interval = 10,
		duration = ms,
		gap = interval / duration;

	isIn
		? element.classList.add('in')
		: element.classList.remove('in');

	switch (true) {
	case !isHidden && type === 'in':
		return ;
	case isHidden && type === 'out':
		return ;
	}

	let elementFullHeight = element.clientHeight;
	let paddingTop = parseInt(window.getComputedStyle(element, null).getPropertyValue('padding-top').replace('px'));
	let paddingBottom = parseInt(window.getComputedStyle(element, null).getPropertyValue('padding-bottom').replace('px'));
	let prevDisplayStyle = window.getComputedStyle(element, null).getPropertyValue('display');
	let prevMaxHeight = '0';
	let prevTopPadding = '0';
	let prevBottomPadding = '0';
	let prevOpacity = '0';

	if (isIn) {
		prevOpacity = element.style.opacity;
		prevOpacity = prevOpacity.length ? prevOpacity : '0';

		prevMaxHeight = element.style.maxHeight;
		prevMaxHeight = prevMaxHeight.length ? prevMaxHeight : '0';

		prevTopPadding = element.style.paddingTop;
		prevTopPadding = prevTopPadding.length ? prevTopPadding : '0';

		prevBottomPadding = element.style.paddingBottom;
		prevBottomPadding = prevBottomPadding.length ? prevBottomPadding : '0';

		element.style.overflow = null;
		element.style.maxHeight = null;
		element.style.display = prevDisplayStyle === 'none' ? 'block' : prevDisplayStyle;
		elementFullHeight = element.clientHeight;

		element.style.maxHeight = prevMaxHeight;
		element.style.paddingTop = prevTopPadding;
		element.style.paddingBottom = prevBottomPadding;
	}

	element.style.overflow = 'hidden';


	let elementHeight = isIn ? parseInt(prevMaxHeight.replace('px', '')) : elementFullHeight;
	let currentPaddingTop = isIn ? parseInt(prevTopPadding.replace('px', '')) : paddingTop;
	let currentPaddingBottom = isIn ? parseInt(prevBottomPadding.replace('px', '')) : paddingBottom;
	let opacity = isIn ? parseFloat(prevOpacity) : 1;

	let __slide = function () {

		opacity = isIn ? opacity + gap : opacity - gap;

		elementHeight = isIn
			? elementHeight + elementFullHeight * gap
			: elementHeight - elementFullHeight * gap;

		currentPaddingTop = isIn
			? currentPaddingTop + paddingTop * gap
			: currentPaddingTop - paddingTop * gap;

		currentPaddingBottom = isIn
			? currentPaddingBottom + paddingBottom * gap
			: currentPaddingBottom - paddingBottom * gap;


		element.style.opacity = opacity;
		element.style.maxHeight = Math.abs(Math.ceil(elementHeight)) + 'px';
		element.style.paddingTop = Math.abs(Math.ceil(currentPaddingTop)) + 'px';
		element.style.paddingBottom = Math.abs(Math.ceil(currentPaddingBottom)) + 'px';

		// let isFinish = opacity <= 0 || opacity >= 1;
		let isFinish = elementHeight <= 0 || opacity >= 1;
		if (elementHeight <= 0) {
			element.removeAttribute('style');
		}

		if (opacity >= 1) {
			element.style.overflow = null;
			element.style.maxHeight = null;
			element.style.paddingTop = null;
			element.style.paddingBottom = null;
			element.style.opacity = null;
		}

		return isFinish;
	};

	onInterval(__slide, element, interval);

	return isIn;
};

let fade = function (element, type, ms = 400) {


	let isHidden = ['none', ''].indexOf(element.style.display) >= 0;
	if (type === 'toggle' || !type) {
		type = isHidden ? 'in' : 'out';
	}

	let isIn = type === 'in',
		opacity = isIn ? 0 : 1,
		interval = 10,
		duration = ms,
		gap = interval / duration;

	switch (true) {
	case !isHidden && type === 'in':
		return ;
	case isHidden && type === 'out':
		return ;
	}

	if (isIn) {
		element.style.display = 'block';
	}

	element.style.opacity = opacity;


	let __fade = function () {

		opacity = (isIn ? opacity + gap : opacity - gap) * 1000;
		opacity = Math.abs(Math.round(opacity)) / 1000;
		element.style.opacity = opacity;

		if (opacity < 0.001) {
			opacity = 0;
		}

		if (opacity <= 0) {
			element.style.display = 'none';
			element.removeAttribute('style');
		}

		return (opacity <= 0 || opacity >= 1);
	};

	onInterval(__fade, element, interval);

	return isIn;
};

let makeHtml = str => {
	let div = document.createElement('div');
	div.innerHTML = str.trim();
	return div.children[0];
};

let copyAttributes = function (source, target, attrsList = ['id', 'title', 'class', 'data-*'], styleOptions = {}) {


	if (typeof attrsList === 'object') {
		styleOptions = attrsList;
		attrsList = ['id', 'title', 'class', 'data-*'];
	}

	let attrsCount = attrsList.length;

	while (attrsCount--) {
		let attrName = attrsList[attrsCount];
		switch (true) {
		case (attrName === 'id' && source.id && source.id.length > 0):
			target.id = `${source.id}${styleOptions.idSuffix}`;
			break;

		case attrName === 'class':
			target.className = target.className + ' ' + source.className;
			break;

		case attrName === 'data-*':
			let sourceAttrsCount = source.attributes.length;
			while(sourceAttrsCount--) {
				let attrName = source.attributes[sourceAttrsCount];
				if (/^data-(.+)/gim.test(attrName.name)){
					let value = source.getAttribute(attrName.name);
					target.setAttribute(attrName.name, value);
				}
			}
			break;

		default:
			let value = source.getAttribute(attrName);
			if (value !== null) {
				target.setAttribute(attrName, value);
			}
		}
	}
};

let attributesToString = function (element, appends = {}, styleOptions = {}) {

	let result = '';
	let sourceAttrsCount = element.attributes.length;
	appends = Object.assign({}, appends);

	while(sourceAttrsCount--) {
		let attr = element.attributes[sourceAttrsCount];
		let attrValue = attr.value;

		if (attr.name === 'id' && attr.value && attr.value.length) {
			attrValue = attrValue + styleOptions.idSuffix;
		}

		if (appends[attr.name] && appends[attr.name].length) {
			result = (attrValue ? attrValue : '') + appends[attr.name];
			delete appends[attr.name];
		}
		result = `${result} ${attr.name}${ attrValue ? `="${attrValue}"` : '' }`;
	}

	let otherKeys = Object.keys(appends);
	let otherKeysCount = otherKeys.length;
	while (otherKeysCount--) {
		let key = otherKeys[otherKeysCount];
		if (Object.prototype.hasOwnProperty.call(appends, key)) {
			let value = appends[key];
			if (key === 'class' && !value.length) {
				continue;
			}

			result = `${result} ${key}${value && value.length ? `="${value.trim()}"` : '' }`;
		}
	}

	return result;
};


module.exports = {fade, slide, makeHtml, copyAttributes, attributesToString, onInterval};
