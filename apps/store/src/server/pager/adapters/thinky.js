'use strict';
const defaultPageOptions = require('../defaults');

function isFunction(functionToCheck) {
    return functionToCheck && ({}).toString.call(functionToCheck) === '[object Function]';
}

function isObject (objectToCheck) {
    return typeof objectToCheck === "object" && !(objectToCheck instanceof Array);
}

function* page (schema, r, current = 1, options = {}) {
	options = Object.assign({}, defaultPageOptions, options);

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



	// let {skip: defaultSkip} = this.options;


	let tableName = schema.getTableName();
	let count = yield r.table(tableName).filter({}).count();

	let countRem = count % options.quantity
	let totalPages = (count - countRem) / options.quantity + Boolean(countRem);

	let result = {
		data : yield r.table(tableName).filter({}).run(),
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

	return result;
}


module.exports = page;
