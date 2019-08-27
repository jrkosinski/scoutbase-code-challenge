'use strict';

class IAuthManager {
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
    async /*json*/ addOrAuthenticateUser(username, password) { }

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
    async /*json*/ authenticateUser(username, password) { }

    /**
    * Given an auth token, attempts to get the user from the database by that token.
    *
    * @param {string} token
    * @returns {json} the user object, or null if not found
    */
    async /*json*/ getUserByToken(token) { }

    /**
    * indicates whether or not the given user has yet been authenticated
    *
    * @param {*} username identifies the user
    * @returns {bool} true if authenticated
    */
    /*bool*/ userIsAuthenticated(username) { }
}

exports.IAuthManager = IAuthManager;