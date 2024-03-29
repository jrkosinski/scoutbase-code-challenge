'use strict';

/**
 * scoutbase-code-challenge
 * ------------------------
 * entry point: configures IOC container, database, Apollo server, and express.
 * Starts the server running.
 *
 * Just some quick notes about this implementation, for the reader:
 *
 * - uses apollo-server-express and express to implement the GraphQL and http servers (see server.js)
 *
 * - two DB implementations: mongo-mock and mongoose (mongodb); mongo-mock is the default (see ./lib/data)
 *
 * - while the mongo-mock implementation has embedded documents (leading to duplication of data),
 *      the mongodb implementation uses document references
 *
 * - I've checked .env just to make testing easier for you
 *
 * - dates are stored in the database as unix timestamps, but presented in GraphQL as strings
 *      (there is in fact an additional birthday_timestamp property that returns the unix timestamp)
 *
 * - scoutbase_rating property is restricted using a custom SchemaDirectiveVisitor
 *      (see ./gqlTypes/authDirective) which takes data from a context object. Authentication is
 *      very simple and is defined in ./lib/auth
 *
 * - this solution contains unit tests
 *
 * - yes I know it's overengineered for the requirements, but it's for demonstration purposes
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