'use strict';

const mailer = require('../mailer');


module.exports = router => {
	router.get('/test/email/:mailName', function* () {

		let {language} = this.query;
		let data = {language};

		data.publicUrl = this.request.origin;
		switch (this.params.mailName) {
			case 'confirmation':
				data = Object.assign({}, data, {
					confirmationLink: 'Http://fintechfinance.com/registration.php?JCwXeVbnARLbS-a1Cm-MW0BdzimBdGLifE_1sBK35Pgd6iqsSQJZytxy8myHWf_1wI_1XNo6XGF1'
				})
				break;

			case 'info':
				data = Object.assign({}, data, {
					email: 'johnmaxwell@gmail.com',
					password: 'qwerty1234567890',
					email: 'JohnMaxwell@gmail.com',
					account :{
						first: 'John',
						last: 'Maxwell',
						email: 'JohnMaxwell@gmail.com',
						phone: '+4(555)555-55-55',
					}
				})
				break;

			case 'order':
				data = Object.assign({}, data, {
					orderId: 530,
					orders: [
						{
							title : 'KB Komercni Banka',
							note : 'Personal presence',
							price : '€ 1 000'
						},
						{
							title : 'Package for a quick business start',
							note : `
								— English LLP with two nominal partners <br />
								— Bank account (Czech Republic)
							`,
							price : '€ 2 000'
						},
					],
					total : '€ 3 000'
				})
				break;


			case 'shipped':
				data = Object.assign({}, data, {
					orderId: 530,
					carrier : 'DHL',
					tracking : {
						number : '1234567890',
						link : 'http://www.dhl.com/en/express/tracking.html?AWB=1234567890&brand=DHL',
					},
					orders: [
						{
							title : 'KB Komercni Banka',
							note : 'Personal presence',
							price : '€ 1 000'
						},
						{
							title : 'Package for a quick business start',
							note : `
								— English LLP with two nominal partners <br />
								— Bank account (Czech Republic)
							`,
							price : '€ 2 000'
						},
					],
					total : '€ 3 000'
				})
				break;

			case 'contactRequest':
				data = Object.assign({}, data, {
					name : 'John von Neumann',
					email : 'me@westtrade.tk',
					phone : '+7 903 699 65 49',
					theme : 'PSP',
					text : 'AZAZAZA',
					userLanguage : 'en',
				})

				break;


			case 'changePassword':
				data = Object.assign({}, data, {
					changePasswordLink: 'http://www.dhl.com/en/express/tracking.html?AWB=1234567890&brand=DHL',
				})
				break;

			default:

		}



		this.body = yield mailer.render(this.params.mailName, data, this);
	})
};
