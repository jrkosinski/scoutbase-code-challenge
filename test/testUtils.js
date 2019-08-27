'use strict';

//configure IOC container
const ioc = require('../lib/utils/iocContainer');
ioc.service('authManager', c => require('../lib/auth'));
ioc.service('database', c => require('../lib/data/mockdb'));
ioc.service('loggerFactory', c => require('../lib/utils/winstonLogger'));
ioc.service('ehFactory', c => require('../lib/utils/exceptionHandler'));

const expect  = require('chai').expect;
const database = require('../lib/data/mockdb');
const server = require('../lib/server');

const TEST_SERVER_PORT = 8081;
const MOCKDB_URL = 'http://localhost:3030';
let usernameCounter = 0;

async function initializeDatabase() {
    process.env.MOCKDB_URL = MOCKDB_URL; //TODO: is this necessary?
    await database.initialize(MOCKDB_URL);
}

function generateNewUsername() {
    return 'username' + (usernameCounter++).toString();
}

async function expectNullUser(username) {
    let user = await database.getUser(username)

    expect(user, `test prereq failed: nonexistent user ${username} should be null`).not.to.exist;
}

async function startServer() {
    await server.start(TEST_SERVER_PORT);
}

function getServerUrl() {
    return `http://localhost:${TEST_SERVER_PORT}/graphql`;
}

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
    getServerUrl,
    testAuthOutput
}