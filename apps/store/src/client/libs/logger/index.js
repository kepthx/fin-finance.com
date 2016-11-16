'use strict';

const bunyan = require('bunyan');
const loggerConfig = {
	name : 'web'
};
const logger = bunyan.createLogger(loggerConfig);

module.exports = from => {
	return logger.child({ from });
};
