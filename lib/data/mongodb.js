'use strict';

const LOG_TAG = 'mongodb' ;

const R = require('ramda');
const mongoose = require('mongoose');
const config = require('../utils/config');
const ioc = require('../utils/iocContainer');
const {IDatabase} = require('./database.js');

const logger = ioc.loggerFactory.createLogger(LOG_TAG);
const exception = ioc.ehFactory.createHandler(logger);

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;


//Person schema
const Person = mongoose.model('Person', new Schema({
    name: { type: String },
    birthday_timestamp: { type: Number },
    country: { type: String }
}));

//movie Schema
const Movie = mongoose.model('Movie', new Schema({
    title: { type: String },
    year: { type: Number },
    rating: { type: String },
    actors: [String],
    directors: [String]
}));

//User schema
const User = mongoose.model('User', new Schema({
    username: { type: String },
    password: { type: String },
    salt: {type: String}
}));


/**
 * implements database - standard mongodb database
 */
class MongoDB extends IDatabase {
    constructor() {
        super();
        this.initialized = false;
    }

    /**
     * initializes schema and initiates connection
     */
    /*bool*/ async initialize() {
        return new Promise((resolve, reject) => {

            if (this.initialized) {
                logger.info('database is already initialized; exiting');
                resolve(true);
                return;
            }

            logger.info(`connecting to mongodb instance at ${config.mongodbConnection()}...`);
            mongoose.connect(config.mongodbConnection(), {useNewUrlParser: true});
            mongoose.connection.once('open', function() {
                logger.info('...connected');
                resolve(true);
            });

            //TODO: handle failure to connect
        });
    }

    /**
     * retrieves all Movie records from database
     */
    /*movie[]*/ async getMovies() {
        return await exception.tryAsync(async() => {
            logger.info('retrieving movies...');

            const people = await Person.find({});
            const movies = await Movie.find({});

            //replace actors & directors ids with real objects
            R.forEach((m) => {
                replaceArray(m, 'actors', R.filter((a) => { return R.includes(a.id, m.actors) }, people));
                replaceArray(m, 'directors', R.filter((d) => { return R.includes(d.id, m.directors) }, people));
            }, movies);

            if (movies) {
                logger.info(`returning ${movies.length} movies`);
            }
            else {
                logger.warn('retrieved null movies array');
            }

            return movies;
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
        return await exception.tryAsync(async() => {
            //TODO: check for null input
            const existingUser = await this.getUser(user.username);

            if (existingUser) {
                logger.info(`user ${user.username} already exists`);
                return existingUser.id;
            }
            else {
                logger.info(`adding new user ${JSON.stringify(user)}`);
                const newUser = new User(user);
                const output = await newUser.save();
                return output.id;
            }
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
        return await exception.tryAsync(async() => {
            //TODO: check for null input
            logger.info(`retrieving user ${username}`);
            return await User.findOne({username:username});
        });
    }

    //TODO: connection mgmt for mongodb
    close() {
        mongoose.connection.close();
    }
}

/**
 * helper function for replacing a movie's actors and directors arrays
 * (arrays of ids) with arrays of actual documents retrieved.
 *
 * @param {movie} parent
 * @param {string} property
 * @param {Person[]} newArray
 */
function replaceArray(parent, property, newArray) {
    for (let i=0; i<parent[property].length; i++) {
        parent[property][i] = newArray[i];
    }
}

//single instance
const database = new MongoDB();
module.exports = database;