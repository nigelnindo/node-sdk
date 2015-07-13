/**
 * @module misc
 * @description
 * Handling miscellanous operations
 */


"use strict";


// own modules
var generate = require("./generate");


// module exports
exports = module.exports = {
    /**
     * Contact the Ma3Route Team
     * @type {itemsCreateOneRequest}
     */
    contactUs: generate.newCreateOne("contactUs"),
};