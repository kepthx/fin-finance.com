'use strict';


module.exports = {};
module.exports.mozilla = /mozilla/.test(navigator.userAgent.toLowerCase()) && !/webkit/.test(navigator.userAgent.toLowerCase());
module.exports.webkit = /webkit/.test(navigator.userAgent.toLowerCase());
module.exports.opera = /opera/.test(navigator.userAgent.toLowerCase());
module.exports.msie = /msie/.test(navigator.userAgent.toLowerCase());
