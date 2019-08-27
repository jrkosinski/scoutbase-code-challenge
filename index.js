'use strict';

//config
const config = require('./lib/config');
if (!config.isProd()) {
    require('dotenv').config();
}

//configure IOC container
const ioc = require('./lib/iocContainer');
ioc.service('loggerFactory', c => require('./lib/winstonLogger'));
ioc.service('ehFactory', c => require('./lib/exceptionHandler'));
