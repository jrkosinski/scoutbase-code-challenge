'use strict';

//configure IOC container
const ioc = require('../lib/iocContainer');
ioc.service('loggerFactory', c => require('../lib/winstonLogger')); 
ioc.service('ehFactory', c => require('../lib/exceptionHandler')); 

const expect  = require('chai').expect;

describe('Movie Tests', async () => {
    it ('get movies', async () => {
		
    });
});
