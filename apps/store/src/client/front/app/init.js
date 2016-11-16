'use strict';

const domready = require('domready');
const {fade, slide} = require('../libs/transform');
const qwery = require('qwery');
const styleInputs = require('../libs/styleInputs');

const emulatePlaceholdersForOldBrowser = require('./emulatePlaceholdersForOldBrowser');
const setupAccordions = require('./accordions');
const setupFancybox = require('./fancybox');

domready(function () {

	document.body.classList.remove('loaded');
	let isIos = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
	document.body.classList.toggle('ios', isIos);

	emulatePlaceholdersForOldBrowser();

	let catchedElements = ['input', 'textarea'];
	document.body.addEventListener('focus', function (event) {
		if (catchedElements.indexOf(event.target.tagName.toLowerCase()) >= 0) {
			let placeholder = event.target.getAttribute('placeholder');
			event.target.setAttribute('data-placeholder', placeholder || '');
			event.target.setAttribute('placeholder', '');
		}
	}, true);

	document.body.addEventListener('focusout', function (event) {
		if (catchedElements.indexOf(event.target.tagName.toLowerCase()) >= 0) {
			let placeholder = event.target.getAttribute('data-placeholder');
			event.target.setAttribute('placeholder', placeholder || '');
		}
	}, true);


	let [languageLinkSelector] = qwery('.box-language__link');
	let [languageList] = qwery('.js-list-language');
	let [menuButton] = qwery('.button-menu');
	let [mainMenu] = qwery('nav');

	menuButton.addEventListener('click', function (event) {
		this.classList.toggle('active', slide(mainMenu,'toggle'));
		fade(languageList, 'out', 0);
		event.preventDefault();
	});

	languageLinkSelector.addEventListener('click', function (event) {
		this.classList.toggle('active');
		fade(languageList, 'toggle', 100);
		event.preventDefault();
		event.stopPropagation();
	});

	document.body.addEventListener('click', function () {
		fade(languageList, 'out', 100);
	});

	let styledElements = qwery('.js-styled, .styled');
	styleInputs(styledElements);
	setupAccordions();
	setupFancybox();
});
