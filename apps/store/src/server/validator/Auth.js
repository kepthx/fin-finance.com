'use strict';



let login = {

	login: {
		presence: {
			message : 'Field `Login` can\'t be blank'
		},

		length: {
			minimum: 3,
			maximum: 100,
			tooShort : 'Field `Login` minimum is %{count} characters',
			tooLong : 'Field `Login` is is too long (max is %{count} chars)'
		},
	},

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
};




let registration = {

	first: {

		length: {
			minimum: 3,
			maximum: 100,
			tooShort : 'Field `First name` minimum is %{count} characters',
			tooLong : 'Field `First name` is is too long (max is %{count} chars)'
		},

	},

	last: {

		length: {
			minimum: 3,
			maximum: 100,
			tooShort : 'Field `Last name` minimum is %{count} characters',
			tooLong : 'Field `Last name` is is too long (max is %{count} chars)'
		},
	},

	first_last : {

		length: {
			minimum: 3,
			maximum: 100,
			tooShort : 'Field `Last name` minimum is %{count} characters',
			tooLong : 'Field `Last name` is is too long (max is %{count} chars)'
		},
	},

	email : {

		presence:  {
			message : 'Field `E-mail` can\'t be blank'
		},

		fieldIsUnique : {
			message : 'That\'s email already registrered',
			model: 'User'
		},

		email: {
			message : 'Field `E-mail` is not a valid email'
		},

		length: {
			minimum: 3,
			maximum: 100,
			tooShort : 'Field `E-mail` minimum is %{count} characters',
			tooLong : 'Field `E-mail` is is too long (max is %{count} chars)'
		},
	},

	phone : {
		fieldIsUnique : {
			message : 'That\'s phone already registrered',
			model: 'Profiles'

		},

		presence: {
			message : 'Field `Phone` can\'t be blank'
		},
		length: {
			minimum: 3,
			maximum: 100,
			tooShort : 'Field `Phone` minimum is %{count} characters',
			tooLong : 'Field `Phone` is is too long (max is %{count} chars)'
		},
	},

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


let recovery = {

	email : {
		presence: 'Field `Email` can\'t be blank'
	}

};

module.exports = {login, registration, recovery};
