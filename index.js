'use strict';

const LOG_TAG = 'index';

//config
const config = require('./lib/config');
if (!config.isProd()) {
    require('dotenv').config();
}

//configure IOC container
const ioc = require('./lib/iocContainer');
ioc.service('loggerFactory', c => require('./lib/winstonLogger'));
ioc.service('ehFactory', c => require('./lib/exceptionHandler'));
ioc.service('database', c => require('./lib/data/mockdb'));

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