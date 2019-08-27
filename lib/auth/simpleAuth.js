'use strict'

const LOG_TAG = 'auth';

const crypto = require('crypto');
const uuid = require('uuid/v4');
const ioc = require('../utils/iocContainer');
const { IAuthManager } = require('./authManager');

const logger = ioc.loggerFactory.createLogger(LOG_TAG)
const exception = ioc.ehFactory.createHandler(logger);
const database = ioc.database;

/**
 * dictionary in memory to store usernames with tokens. This method of auth storage is very
 * simple and isjust an expedient. We could implement a new implementation of AuthManager
 * that uses JWT and replace it with this one in the IOC container.
 */
const authenticatedUsers = {};

class SimpleAuthManager extends IAuthManager {
    constructor() {
        super();
    }

   /**
    * if the user already exists, an attempt will be made to authenticate the user
    * (by calling authenticateUser); otherwise an attempt will be made to create
    * a new user and then authenticate it.
    *
    * @param {string} username the username
    * @param {string} password the clear unhashed password
    *
    * @returns {json} the output of authenticateUser
    */
    async /*json*/ addOrAuthenticateUser(username, password) {
        return await exception.tryAsync(async () => {
            if (username && password) {
                const existingUser = await database.getUser(username);

                //attempt to add user if not existent
                if (!existingUser) {
                    logger.info(`user ${username} does not exist, will attempt to add`);
                    await database.addUser(createUserObject(username, password));
                }

                //attempt to authenticate user
                return await this.authenticateUser(username, password);
            }
        });
    }

    /**
    * attempts to authenticate the user. If the user cannot be authenticated (e.g. wrong password,
    * nonexistent username) then a structure will still be returned, but it will have no auth token.
    *
    * @param {string} username the username
    * @param {string} password the clear unhashed password
    *
    * @returns {json} in the form:
    * {
    *  token: <string>
    *  user: {
    *      id: <string>
    *      name: <string>
    *  }
    * }
    */
    async /*json*/ authenticateUser(username, password) {
        return await exception.tryAsync(async () => {
            //create blank default output
            const output = {
                token: null,
                user: {
                    id: null,
                    name: null
                }
            };

            if (username && password) {

                //check for existing user
                if (username && username.length) {
                    const existingUser = await database.getUser(username);

                    if (existingUser && existingUser.password === saltAndHashString(password, existingUser.salt)) {
                        logger.info(`user ${username} passed authentication`);

                        //get existing token or create new
                        let authToken = authenticatedUsers[username];
                        if (!authToken)
                            authToken = createAuthToken();

                        //add properties to output
                        output.token = authToken;
                        output.user.id = existingUser.id;
                        output.user.name = existingUser.username;

                        //store authentication
                        authenticatedUsers[username] = authToken;
                    }
                    else {
                        if (!existingUser)
                            logger.warn(`user ${username} was not found, could not authenticate`);
                        else
                            logger.warn(`user ${username} auth rejected; invalid password`);
                    }
                }
            }

            return output;
        });
    }

    /**
    * Given an auth token, attempts to get the user from the database by that token.
    *
    * @param {string} token
    * @returns {json} the user object, or null if not found
    */
    async /*json*/ getUserByToken(token) {
        return await exception.tryAsync(async () => {
            let output = null;

            //find token match
            let username = null;
            if (token && token.length) {
                for (let key in authenticatedUsers) {
                    if (authenticatedUsers[key] === token) {
                        username = key;
                    }
                }
            }

            //attempt to get user
            if (username) {
               output = await database.getUser(username);

               //log output
               if (output) {
                   logger.info(`user ${username} is authorized`);
               }
               else {
                   logger.warn(`user ${username} not found`);
               }
            }
            else {
               logger.warn(`user ${username} not found among authenticated users`);
            }

            return output;
        });
    }

    /**
    * indicates whether or not the given user has yet been authenticated
    *
    * @param {*} username identifies the user
    * @returns {bool} true if authenticated
    */
    /*bool*/ userIsAuthenticated(username) {
        return exception.try(() => {
           return (authenticatedUsers[username] ? true: false);
        });
    }
}


/**
 * generates a unique authentication token (guid)
 *
 * @returns {string} (guid)
 */
function /*string*/ createAuthToken() {
    return uuid();
}

/**
 * creates a new user object to be added to the DB, with the given username & password
 * and the password salted/hashed
 *
 * @param {string} username
 * @param {string} password
 * @returns {json} the new user object
 */
function /*json*/createUserObject(username, password) {
    return saltAndHashPassword({
        username: username,
        password: password
    });
}

/**
 * salts and hashes the current password of the given user object; returns a reference
 * to the modified object
 *
 * @param {json} user
 * @returns {json} the original user object with salt and hashed password added
 */
function /*json*/ saltAndHashPassword(user) {
    return exception.try(() => {
        user.salt = uuid();
        user.password = saltAndHashString(user.password, user.salt);
        return user;
    });
}

/**
 * appends the given salt to the given string and returns a sha-256 hash
 *
 * @param {string} s
 * @param {string} salt
 * @returns {string} a sha-256 hash
 */
function /*string*/ saltAndHashString(s, salt) {
    return exception.try(() => {
        return (s && salt) ? crypto.createHash('sha256').update(s + salt).digest('base64') : null;
    });
}

//return singleton instance
const auth = new SimpleAuthManager();
module.exports = auth;