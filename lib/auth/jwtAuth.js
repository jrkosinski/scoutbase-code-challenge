'use strict'

const LOG_TAG = 'jwt';

const ioc = require('../utils/iocContainer');
const { IAuthManager } = require('./authManager');
const authUtils = require('./authUtils');

const logger = ioc.loggerFactory.createLogger(LOG_TAG)
const exception = ioc.ehFactory.createHandler(logger);
const database = ioc.database;

/**
 * just a placeholder for now; not going to implement but just demonstrate
 * that in a real solution we'd implement something like this and add it to the
 * IOC container in place of SimpleAuthManager.
 */
class JwtAuthManager extends IAuthManager {
    constructor() {
        super();
    }
}

//return singleton instance
const instance = new JwtAuthManager();
module.exports = instance;