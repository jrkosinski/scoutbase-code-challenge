'use strict';

const LOG_TAG = 'mockdb';

const ioc = require('../ioc');
const config = require('../config');
const R = require('ramda');
const mongo = require('mongo-mock');

const logger = ioc.loggerFactory.createLogger(LOG_TAG);
const exception = ioc.ehFactory.createHandler(logger);

mongo.max_delay = 0;

const mongoClient = mongo.MongoClient;
//client.persist="mongo.js";

class MockDB {
    constructor() {
        super();
        this.initialized = false;
        this.url = config.mockDataUrl();
    }

    /**
     * initializes the database connection and creates the mock data (only once)
     *
     * @returns {bool} true on success
     */
    async /*bool*/ initialize() {
        return await exception.tryAsync(async () => {
            if (this.initialized) {
                return true;
            }

            const client = await mongoClient.connect(this.url, {});
            const db = client.db();
            const movies = db.collection('movies');
            const users = db.collection('users');

            const movieDocs = [
                createMovie('Gone with the Wind', 1939, 'NA', [
                    createPerson('Vivien Leigh', -1772150400, 'US'),
                    createPerson('Clark Gable', -2174774400, 'US')
                ], [
                    createPerson('Victor Fleming', -2551478400, 'US')
                ]),
                createMovie('Apocalypse Now', 1979, 'NA', [
                    createPerson('Martin Sheen', -928195200, 'US'),
                    createPerson('Marlon Brando', -1443657600, 'US'),
                    createPerson('Robert Duvall', -1230422400, 'US'),
                    createPerson('Laurence Fishburne', -265852800, 'US')
                ], [
                    createPerson('Francis Ford Coppola', -970012800, 'US')
                ]),
                createMovie('The Room', 2003, 'R', [
                    createPerson('Tommy Wiseau', 18144000, 'PL'),
                    createPerson('Juliette Danielle', 345081600, 'US')
                ], [
                    createPerson('Tommy Wiseau', 18144000, 'PL')
                ]),
                createMovie('The Prestige', 2006, 'PG-13', [
                    createPerson('Christian Bale', 128736000, 'UK'),
                    createPerson('Hugh Jackman', -38534400, 'AU')
                ], [
                    createPerson('Christopher Nolan', 18144000, 'UK')
                ])
            ];

            await users.insertMany([]);
            await movies.insertMany(movieDocs);

            return true;
        });
    }

    /**
     * retrieves all Movie records from database
     */
    async /*movie[]*/ getMovies() {
        return await exception.tryAsync(async () => {
            const client = await mongoClient.connect(this.url, {});
            const db = client.db();
            const movies = db.collection('movies');

            const output = await movies.find({}, {}).toArray();

            db.close();
            return output;
        });
    };
}

/**
 * helper function; creates mock Person (actors & directors) data item
 *
 * @param {string} name
 * @param {int} birthday
 * @param {string} country
 */
function /*json*/ createPerson(name, birthday, country) {
    return {
        name: name,
        country: country,
        birthday_timestamp: birthday
    };
}

/**
 * helper function; creates mock Movie data item
 *
 * @param {string} title
 * @param {int} year
 * @param {string} rating
 * @param {[*]} actors
 * @param {[*]} directors
 */
function /*json*/ createMovie(title, year, rating, actors, directors) {
    const output = {
        title: title,
        year: year,
        rating: rating,
        actors: [],
        directors: []
    };

    if (actors) {
        output.actors = R.concat(output.actors, actors);
    }

    if (directors) {
        output.directors = R.concat(output.directors, directors);
    }

    return output;
}

//export singleton instance
const database = new MockDB();
module.exports = database;
