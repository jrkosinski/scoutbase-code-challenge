'use strict';

const LOG_TAG = 'server';

const ioc = require('./iocContainer');
const express = require('express');

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