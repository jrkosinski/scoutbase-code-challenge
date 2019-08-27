'use strict';

/**
 * common interface for classes which encapsulate a database
 */
class IDatabase {
    constructor() { }

    /**
     * perform any initialization here
     */
    initialize() {}

    /**
     * retrieves a list of all movies
     */
    /*movie[]*/ getMovies() {}

    /**
     * adds a new user record to the database
     *
     * @param {json} user
     * @returns {string} unique id of newly added or existing user
     */
    /*string*/ addUser(user) {}

    /**
     * retrieves a user record by username
     *
     * @param {string} username
     * @returns {user} the user object or null
     */
    /*user*/ getUser(username) {}

    /**
     * close the DB connection
     */
    close() {}
}

exports.IDatabase = IDatabase;