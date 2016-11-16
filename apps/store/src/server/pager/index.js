'use strict';

// const adapterMongoose = require('./adapters/mongoose');
const adapterThinky = require('./adapters/thinky');
const helpers = require('./helpers');

/**

    pager fields
        data [] - list of items
        pager - {
            current int default 0
            total int default 0 - total page count
        }


# TODO
-[] Описать документацию
-[] Сделать метод chainable
-[] Посмотреть возможность вызова page в теле запроса, без дополнительных параметров
-[] Сделать плагины для следующих ORM/ODM
    -[] Waterline
    -[] Caminte
    -[] Sqlize



**/


// module.exports.mongoosePlugin = adapterMongoose;
module.exports.thinkyPlugin = adapterThinky;

for (var helperName in helpers) {
    if (helpers.hasOwnProperty(helperName)) {
        module.exports[helperName] = helpers[helperName];
    }
}
