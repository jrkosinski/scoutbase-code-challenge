'use strict';

/**
 * scoutbase-code-challenge
 * ------------------------
 * unit tests: common utilities used by many unit tests.
 *
 * Author: John R. Kosinski
 * Date: 27 Aug 2019
 */

//configure IOC container
const ioc = require('../lib/utils/iocContainer');
ioc.service('authManager', c => require('../lib/auth/simpleAuth'));
ioc.service('database', c => require('../lib/data/mockdb'));
ioc.service('loggerFactory', c => require('../lib/utils/winstonLogger'));
ioc.service('ehFactory', c => require('../lib/utils/exceptionHandler'));

const expect  = require('chai').expect;
const database = require('../lib/data/mockdb');
const server = require('../lib/server');

const TEST_SERVER_PORT = 8081;
const MOCKDB_URL = 'http://localhost:3030';
const APOLLO_SERVER_URL = `http://localhost:${TEST_SERVER_PORT}/graphql`;
let usernameCounter = 0;

/**
 * sets up the mock database for use
 */
async function initializeDatabase() {
    process.env.MOCKDB_URL = MOCKDB_URL;
    await database.initialize(MOCKDB_URL);
}

/**
 * generates a new unique username (unique within current test run)
 *
 * @returns {string} new username
 */
function generateNewUsername() {
    return 'username' + (usernameCounter++).toString();
}

/**
 * attempts to retrieve the specified user from the database, then asserts that it is null
 * (should be null - expected to not yet exist)
 *
 * @param {*} username
 */
async function expectNullUser(username) {
    let user = await database.getUser(username)

    expect(user, `test prereq failed: nonexistent user ${username} should be null`).not.to.exist;
}

/**
 * initializes & starts the Apollo server.
 */
async function startServer() {
    await server.start(TEST_SERVER_PORT);
}

/**
 * returns the URL of the Apollo Server request endpoint.
 *
 * @returns {string} url
 */
function getApolloServerUrl() {
    return APOLLO_SERVER_URL;
}

/**
 * runs assertions on the output of a login or createUser request.
 *
 * @param {*} authOutput output of auth operation
 * @param {*} typeName login | createUser
 */
function testAuthOutput(authOutput, typeName) {
    expect(authOutput[typeName], `graphql query for ${typeName} returned nothing`).to.exist;
    expect(authOutput[typeName]).to.have.property('token');
    expect(authOutput[typeName]).to.have.property('user');
    expect(authOutput[typeName].user).to.have.property('id');
    expect(authOutput[typeName].user).to.have.property('name');
}

module.exports = {
    initializeDatabase,
    generateNewUsername,
    expectNullUser,
    startServer,
    getApolloServerUrl,
    testAuthOutput
}