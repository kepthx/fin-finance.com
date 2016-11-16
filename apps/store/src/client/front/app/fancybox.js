'use strict';

const qwery = require('qwery');
const {fade, makeHtml} = require('../libs/transform');

let isOpened = false;

let openFancyboxEvent;
let closeTimer;
let modalInitParent;


document.body.addEventListener('click', function (event) {
	if (openFancyboxEvent) {
		openFancyboxEvent(event);
	}
});


document.body.addEventListener('click', function (event) {
	if (event.target.className.split(' ').indexOf('fancybox-close') >= 0) {
		closeFancybox();
		event.preventDefault();
		return ;
	}
}, true);



let closeFancybox = function (modalId) {

	isOpened = false;

	let [openedModalWindow] = qwery('.fancybox-opened');
	if (openedModalWindow) {

		if (closeTimer) {
			clearTimeout(closeTimer);
		}

		let timeOfClose = 400;
		fade(openedModalWindow, 'out', timeOfClose);
		closeTimer = setTimeout(function () {
			openedModalWindow.parentNode.removeChild(openedModalWindow);
			closeTimer = null;

			let [onlyWindow] = qwery('.window-open', openedModalWindow);
			if (modalInitParent) {
				modalInitParent.appendChild(onlyWindow);
				modalInitParent = null;
			}

		}, timeOfClose);
	}
};

let openFancybox = function (modalId, withoutFade = false) {

	if (isOpened) {
		closeFancybox();
	}

	isOpened = modalId;

	let [currentModal] = qwery(modalId);
	if (!currentModal) {
		return;
	}

	modalInitParent = currentModal.parentNode;

	if (!currentModal) {
		return false;
	}

	let currentModalTemplate = `
		<div class="fancybox-wrap fancybox-desktop fancybox-type-inline fancybox-opened" tabindex="-1">
			<div class="fancybox-skin" tabindex="-1" style="padding: 0px; width: auto; height: auto;">
				<div class="fancybox-outer">
					<div class="fancybox-inner" style="overflow: auto; width: 715px; height: auto;">
					</div>
				</div>
				<a title="Close" class="fancybox-item fancybox-close" href="javascript:;"></a>
			</div>
		</div>
	`;

	let domElement = makeHtml(currentModalTemplate);
	let [wrapper] = qwery('.fancybox-inner', domElement);
	wrapper.appendChild(currentModal);


	domElement.addEventListener('click', function (event) {
		event.stopPropagation();
	}, true);

	document.body.appendChild(domElement);

	if (!withoutFade){
		fade(domElement, 'in', 300);
	}
};


module.exports = function () {

	if (window.location.hash) {
		openFancybox(window.location.hash, true);
	}

	openFancyboxEvent = function (event) {

		let fancyBoxButtons = qwery('.fancybox');
		let isFancyBoxButton = fancyBoxButtons.indexOf(event.target) >= 0;

		if (!isFancyBoxButton) {

			if (isOpened) {
				closeFancybox();
			}

			return ;
		}

		openFancybox(event.target.getAttribute('href'));
		event.preventDefault();
	};
};


module.exports.open = openFancybox;
module.exports.close = closeFancybox;
