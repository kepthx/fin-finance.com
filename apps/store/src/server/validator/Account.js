'use strict';


let changePassword = (hasActivationToken, userId) => {

	let result = {

		password : {

			presence: {
				message : 'Field `Password` can\'t be blank'
			},
			length: {
				minimum: 3,
				maximum: 100,
				tooShort : 'Field `Password` minimum is %{count} characters',
				tooLong : 'Field `Password` is is too long (max is %{count} chars)'
			},
		},

		confirm  : {
			presence: {
				message : 'Field `Confirm password` can\'t be blank'
			},

			equality: {
				attribute: 'password',
				message: 'Field `Confirm password` not the same as `Password`'
			},
		},
	};

	switch (true) {
	case hasActivationToken:

		result['reset_token'] = {
			checkUser : {
				user: userId,
				type: 'token'
			}
		};


		break;
	default:

		result['old_password'] = {
			checkUser : {
				user: userId,
				type: 'password'
			}
		};
	}

	return result;
};



let constraintsProfileEdit = userProfile => {

	return {
		first: {
			length: {
				minimum: 3,
				maximum: 100,
				tooShort : "Field `First name` minimum is %{count} characters",
				tooLong : "Field `First name` is is too long (max is %{count} chars)"
			},
		},

		last: {
			length: {
				minimum: 3,
				maximum: 100,
				tooShort : "Field `Last name` minimum is %{count} characters",
				tooLong : "Field `Last name` is is too long (max is %{count} chars)"
			},
		},

		first_last : {

			length: {
				minimum: 3,
				maximum: 100,
				tooShort : "Field `Last name` minimum is %{count} characters",
				tooLong : "Field `Last name` is is too long (max is %{count} chars)"
			},
		},

		email : {

			presence:  {
				message : "Field `E-mail` can't be blank"
			},

			fieldIsUnique : {
				message : 'That\'s email already registrered',
				model: 'User',
				exclude: userProfile.email
			},

			email: {
				message : "Field `E-mail` is not a valid email"
			},

			length: {
				minimum: 3,
				maximum: 100,
				tooShort : "Field `E-mail` minimum is %{count} characters",
				tooLong : "Field `E-mail` is is too long (max is %{count} chars)"
			},
		},

		phone : {
			fieldIsUnique : {
				message : 'That\'s phone already registrered',
				model: 'Profiles',
				exclude: userProfile.profile.phone
			},

			presence: {
				message : "Field `Phone` can't be blank"
			},
			length: {
				minimum: 3,
				maximum: 100,
				tooShort : "Field `Phone` minimum is %{count} characters",
				tooLong : "Field `Phone` is is too long (max is %{count} chars)"
			},
		},
	};

}

module.exports = {changePassword, constraintsProfileEdit};
