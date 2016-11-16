'use strict';

const crypto = require('crypto');

let md5 = inputString => crypto.createHash('md5').update(inputString).digest('hex');


module.exports = {md5};
