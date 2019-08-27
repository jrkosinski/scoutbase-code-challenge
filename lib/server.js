'use strict';

const LOG_TAG = 'server';

const ioc = require('./iocContainer');
const express = require('express');
const gqlConfig = require('./gqlConfig');
const config = require('./config');

const database = ioc.database;
const logger = ioc.loggerFactory.createLogger(LOG_TAG);
const exception = ioc.ehFactory.createHandler(logger);

const app = express();
let running = false;

/**
 * combined express & GraphQL server
 */
class Server {
    /**
     * starts the web/GraphQL server running on the given port.
     * can only be started once; if already running, start call will be ignored.
     *
     * @param {int} port
     */
    async start(port) {
        await exception.tryAsync(async () => {
            if (!running) {

                //initialize database
                logger.info('initializing database...');
                await database.initialize(config.mockDataUrl());

                //initialize graphQL schema & server
                logger.info('initializing GraphQL scheme and server...');
                const server = await gqlConfig.initializeSchema();

                //log requests
                app.use((req, res, next) => {
                    logger.info(`request start: ${req.method} ${req.originalUrl} ${JSON.stringify(req.params)}`);
                    next();
                });

                //log responses
                app.use((req, res, next) => {
                    function afterResponse() {
                        res.removeListener('finish', afterResponse);
                        res.removeListener('close', afterResponse);
                        logger.info(`request end: ${res.statusCode} ${res.statusMessage}`);
                    }

                    res.on('finish', afterResponse);
                    res.on('close', afterResponse);
                    next();
                });

                //apply graphQL middleware
                logger.info('applying graphQL server as middleware...');
                server.applyMiddleware({ app, path: '/graphql' });

                //start the server
                logger.info('starting web server...')
                app.listen(port, () => {
                    running = true;
                    logger.info(`app running on port ${port}`);
                });
            }
        });
    }

    /**
     * stops the server if running
     */
    stop() {
        running = false;
    }
}

//export singleton instance
const server = new Server();
module.exports = server;