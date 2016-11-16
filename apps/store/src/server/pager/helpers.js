'use strict';

const qs = require('qs');
// const defaultPageOptions = require('./defaults');

module.exports.pagerLink = function pagerLink(index = 0, { id : pagerId } = { id : 'page' }) {

	let params = Object.assign({}, this.query);
	params[pagerId] = index;

	let result = this.path.replace(/[?].*/, '') + '?' + qs.stringify(params);

	return result;
};


module.exports.generatePager = function generatePager({ pager } = {}) {

	if (!pager) {
		return false;
	}

	pager = Object.assign({ before : [], after : []}, pager);

	if (pager.count <= pager.quantity) {
		return pager;
	}

	let max = parseInt(pager.max), current = parseInt(pager.current);
	let rightDiff = 0, leftDiff = 0, left = 0, right = 0, first = 0, last = 0, half = 0;

	if (max) {
		half = Math.abs(max) / 2;
		first = Math.floor(half);
		last = Math.ceil(half);

		// last = first = max;
		left = current - first, right = current + last;
	}

	leftDiff = current - 1 - first, rightDiff = pager.last - current - last;

	leftDiff = leftDiff < 0 ? Math.abs(leftDiff) : 0;
	rightDiff = rightDiff < 0 ? Math.abs(rightDiff) : 0;

	let from = left - rightDiff, to = right + leftDiff;

	from = from >= 1 ? from : 1;
	to = to && to <= pager.last ? to : pager.last;

	if (pager.last > max) {
		let maxDiff = to - from - max;
		if (maxDiff < 0) {
			to = to + maxDiff;
		}
	}

	if (Boolean(pager.rotate) === false) {

		if (pager.before.length && current >= pager.left && current <= pager.right - right) {
			from = pager.before[0];
		}

		if (pager.after.length && current <= pager.right && current >= pager.left + left) {
			to = pager.after[pager.after.length - 1];
		}
	}

	for (let i = from; i <= to; i++) {
		if (i == current) continue;
		i < current ? pager.before.push(i) : pager.after.push(i);
	}

	return pager;
};
