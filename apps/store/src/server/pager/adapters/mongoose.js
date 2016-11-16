'use strict';

const Query = require('mongoose/lib/query');
const PromiseProvider = require('mongoose/lib/promise_provider');

const defaultPageOptions = require('../defaults');
const mongoose = require('mongoose');

function isFunction(functionToCheck) {
    return functionToCheck && ({}).toString.call(functionToCheck) === '[object Function]';
}

function isObject (objectToCheck) {
    return typeof objectToCheck === "object" && !(objectToCheck instanceof Array);
}


function page (current = 1, options = {}, cb) {

    options = Object.assign({}, defaultPageOptions, options);

    cb = isFunction(cb) ? cb : null;
    if (isObject(current)) {
        let pagerId = 'id' in options ? options.id : "page";
        current = pagerId in current ? current[pagerId] : options.first;
    }

    current = parseInt(current);
    current = current || 1;

    if (!Number.isInteger(current)) {
        throw new Error('Wrong type of parameter "current page". It must be integer.')
    }

    if (current < 1) {
        throw new Error('Wrong type of parameter "current page". It must be greater than 1.')
    }

    let {skip: defaultSkip} = this.options;
    let Promise = PromiseProvider.get();

    return new Promise.ES6((resolve, reject) => {
            //TODO Возможно имеет смысл переписать поскольку call очень может быть очень дорогой операцией
            Query.prototype.count.call(Object.assign({}, this), (err, result) => err ? reject(err) : resolve(result));
        }).then(count => {
            this.limit(options.quantity).skip(options.quantity * (current - 1) + (defaultSkip || 0));
            return this.then(sequence => [count, sequence])
        })
        .then(([count, sequence]) => {

            let countRem = count % options.quantity
            let totalPages = (count - countRem) / options.quantity + Boolean(countRem);


            //TODO Work with pager overflow
            if (count && current > totalPages) {
                let error = new Error("Page not found");
                error.status = 404;
                throw error;
            }

            let result = {
                data : sequence,
                pager : {
                    first: 1,
                    max : options.max,
                    count : count,
                    quantity : options.quantity,
                    current : current,
                    last : totalPages,
                    id : options.id
                }
            }

            if (cb) {
                return cb(null, result);
            }

            return result;

        }).catch(e => {

            if (cb) {
                return cb(e, null);
            }

            throw e;
        })
}

module.exports = function mongoosePager (schema, options) {
    Query.prototype.page = page;
};
