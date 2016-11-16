'use strict';


const thinky = require('./db');
const {type, r} = thinky;



const Profiles = thinky.createModel("Profile", {
	id: type.string(),
	userId: type.string(),
	first: type.string().min(3).max(100).required(),
	last: type.string().min(3).max(100).required(),
	email: type.string().min(3).max(100).email().required(),
	phone: type.string().min(3).max(100).required(),
	createdAt: type.date().default(r.now()),
	updatedAt: type.date().default(r.now()),
}, {
	enforce_extra: 'remove',
	// enforce_missing: true,
});


module.exports = Profiles;
