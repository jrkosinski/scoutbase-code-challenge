'use strict';

const LOG_TAG = 'mockdb';

const ioc = require('../utils/iocContainer');
const {IDatabase} = require('./database.js');
const R = require('ramda');
const crypto = require('crypto');
const mongo = require('mongo-mock');

const logger = ioc.loggerFactory.createLogger(LOG_TAG);
const exception = ioc.ehFactory.createHandler(logger);

mongo.max_delay = 0;

const mongoClient = mongo.MongoClient;
//client.persist="mongo.js";

/**
 * implements database for storing in-memory mock data for testing purposes
 */
class MockDB extends IDatabase {
    constructor() {
        super();
        this.initialized = false;
    }

    /**
     * initializes the database connection and creates the mock data (only once)
     *
     * @returns {bool} true on success
     */
    async /*bool*/ initialize(url) {
        return await exception.tryAsync(async () => {

            if (this.initialized) {
                logger.info('database is already initialized; exiting');
                return true;
            }

            this.url = url;

            logger.info('connecting to DB instance...');
            const client = await mongoClient.connect(this.url, {}); //TODO: if not client
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

            //insert mock data
            logger.info('inserting mock data...');
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
            logger.info('retriving movies....');
            const client = await mongoClient.connect(this.url, {});
            const db = client.db();
            const movies = db.collection('movies');

            const output = await movies.find({}, {}).toArray();

            if (!output) {
                logger.warn('movies query output is null');
            }
            else {
                logger.info(`retrieved ${output.length} movies`);
            }

            db.close();
            return output;
        });
    };

    /**
     * adds a new user object to the database. If a duplicate user exists, the id of that
     * duplicate user will be returned (but no new record added). Usernames must be
     * unique; a unique ID will be generated as well.
     *
     * @param {json} user JSON in the form:
     * {    username: <string>
     *      password: <string>
     *      salt: <string>
     * }
     *
     * @returns the unique ID of the new or existing user
     */
    /*string*/ async addUser(user) {
        return await exception.tryAsync(async () => {
            logger.info(`adding new user ${JSON.stringify(user)}`);

            //TODO: check for null arg

            //generate unique user id - a hash of unique properties of user
            const userHash = createUserHash(user);

            //get user collection
            const client = await mongoClient.connect(this.url, {});
            const db = client.db();
            const users = db.collection('users');

            //check first for existing user
            const existingUser = await users.findOne({id:userHash}, {});

            //if not existing, insert
            if (!existingUser) {
                user.id = userHash;

                logger.info(`inserting new user ${JSON.stringify(user)}`);
                await users.insertMany([user]);
            }
            else {
                logger.info(`user ${user.username} already exists`);
            }

            //return the unique id
            db.close();
            return userHash;
        });
    }

    /**
     * gets a user with the given unique username, if one exists.
     *
     * @param {string} username
     *
     * @returns {user} user object, or null
     */
    /*user*/ async getUser(username) {
        return await exception.tryAsync(async () => {
            logger.info(`retrieving user ${username}`);

            //TODO: check for null arg

            //get collection
            const client = await mongoClient.connect(this.url, {});
            const db = client.db();
            const users = db.collection('users');

            //find
            const output = await users.findOne({username}, {});

            if (!output) {
                logger.warn(`user ${username} not found`)
            }

            db.close();
            return output;
        });
    }

    /**
     * gets the number of users in the database. This is used only for testing purposes.
     *
     * @returns {int} the current number of user records
     */
    /*int*/ async getUserCount() {
        return await exception.tryAsync(async () => {

            //get collection
            const client = await mongoClient.connect(this.url, {});
            const db = client.db();
            const users = db.collection('users');

            //get the count
            const existing = await users.find({}, {}).toArray();
            const output = existing.length;

            db.close();
            return output;
        });
    }

    close() {
        //TODO: implement close method?
    }
}

/**
 * helper function; creates mock Person (actors & directors) data item
 *
 * @param {string} name
 * @param {int} birthday unix timestamp
 * @param {string} country 2-letter country code
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

/**
 * helper function; hashes the unique properties of a user object and returns hash
 * as hex string.
 *
 * @param {json} user
 * @returns {string} a unique hash
 */
function /*string*/ createUserHash(user) {
    const md5 = crypto.createHash('md5');
    md5.update(`{u:${user.username}}`);
    return md5.digest('hex');
}

//export singleton instance
const database = new MockDB();
module.exports = database;
