'use strict';


module.exports = function addCommonAPI(ctx) {

	ctx._sessionSave = null;

	// more flexible
	ctx.__defineGetter__('sessionSave', function () {
		return this._sessionSave;
	});

	ctx.__defineSetter__('sessionSave', function (save) {
		this._sessionSave = save;
	});
};
