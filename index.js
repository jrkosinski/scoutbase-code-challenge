'use strict';

/**
 * scoutbase-code-challenge
 * ------------------------
 * entry point: configures IOC container, database, Apollo server, and express.
 * Starts the server running.
 *
 * Author: John R. Kosinski
 * Date: 27 Aug 2019
 */

const LOG_TAG = 'index';

//config
const config = require('./lib/utils/config');
if (!config.isProd()) {
    require('dotenv').config();
}

//configure IOC container
const ioc = require('./lib/utils/iocContainer');
ioc.service('loggerFactory', c => require('./lib/utils/winstonLogger'));
ioc.service('ehFactory', c => require('./lib/utils/exceptionHandler'));
ioc.service('authManager', c => require('./lib/auth/simpleAuth'));
ioc.service('database', c =>
                config.isProd() ?
                require('./lib/data/mockdb') :
                require('./lib/data/mockdb')
            );

const logger = ioc.loggerFactory.createLogger(LOG_TAG);
const exception = ioc.ehFactory.createHandler(logger);

const server = require('./lib/server');


/**
 * starts the server
 */
async function startServer() {
    await exception.tryAsync(async () => {
        logger.info('starting server...');

        //start server running
        await server.start(config.httpPort());
    });
}

startServer();