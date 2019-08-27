'use strict';

//configure IOC container
const ioc = require('../lib/iocContainer');
ioc.service('loggerFactory', c => require('../lib/winstonLogger'));
ioc.service('ehFactory', c => require('../lib/exceptionHandler'));
ioc.service('database', c => require('../lib/data/mockdb'));

const expect  = require('chai').expect;

describe('Movie Tests', async () => {
    it ('get movies', async () => {
        await(database.initialize());
        const movies = await database.getMovies();

        expect(movies, 'movies output is null').to.exist;
        expect(movies.length).to.not.equal(0, 'movies.length is 0');
    });
});
