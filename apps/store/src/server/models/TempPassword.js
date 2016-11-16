'use strict';

const thinky = require('./db');
const {type} = thinky;
const config = require('config');


const Auth = require('./Auth');


const TempPassword = thinky.createModel('TempPassword', {
	id: type.string(),
	userId: type.string(),
	password: type.string(),
});


Auth.ensureIndex('owner');

Auth.hasOne(TempPassword, 'tempPassword', 'id', 'userId');
TempPassword.belongsTo(Auth, 'owner', 'userId', 'id');



module.exports = TempPassword;
