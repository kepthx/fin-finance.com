'use strict';


let timeoutPromise = counts => new Promise(resolve => setTimeout(resolve, counts));

module.exports = router => {

	router.get('settings.cookies', '/cookies/:operation', function* () {
		let {operation} = this.params;
		operation = ['enable', 'disable'].indexOf(operation) >= 0
			? operation
			: false;

		if (operation) {
			this.cookies.set('cookiesSettings', {
				isEnabled: operation === 'enable'
			});
		}

		// yield timeoutPromise(100);

		this.destinationRedirect();
	});
};
