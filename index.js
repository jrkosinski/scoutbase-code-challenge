'use strict';

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
ioc.service('database', c =>
                config.isProd ?
                require('./lib/data/mongodb') :
                require('./lib/data/mockdb')
            );

const logger = ioc.loggerFactory.createLogger(LOG_TAG);
const exception = ioc.ehFactory.createHandler(logger);

const server = require('./lib/server');

async function startServer() {
    await exception.tryAsync(async () => {
        logger.info('starting server...');

        //start server running
        await server.start(config.httpPort());
    });
}

startServer();