/**
 * @overview Configure websocket server
 * @author Popov Gennadiy <me@westtrade.tk>
 */

'use strict';

const admin = require('./admin');
const contactsController = require('./contactsController');
const accountController = require('./accountController');
const commonController = require('./commonController');
const Auth = require('./Auth');




module.exports = {admin, contactsController, accountController, commonController, Auth};
