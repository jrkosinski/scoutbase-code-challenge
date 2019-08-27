'use strict';

const LOG_TAG = 'authUtil';

const crypto = require('crypto');
const uuid = require('uuid/v4');
const ioc = require('../utils/iocContainer');

const logger = ioc.loggerFactory.createLogger(LOG_TAG)
const exception = ioc.ehFactory.createHandler(logger);


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

/**
 *
 * @param {string} username
 * @param {string} password
 */
function /*bool*/ inputIsValid(username, password) {
    return exception.try(() => {
        let valid = false;

        //validate username & password
        if (username && password) {
            if (username.length > 0 && password.length > 0) {
                valid = true;
            }
        }

        if (!valid) {
            logger.warn(`username/password pair ${username} / ${password} failed input validation`);
        }

        return valid;
    });
}


module.exports = {
    createUserObject,
    saltAndHashPassword,
    saltAndHashString,
    inputIsValid
}