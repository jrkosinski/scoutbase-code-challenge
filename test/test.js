'use strict';

//configure IOC container
const ioc = require('../lib/iocContainer');
const testUtils = require('./testUtils');
const auth = require('../lib/auth');
const GraphQLTestClient = require('./graphQLTestClient');

const expect  = require('chai').expect;
const database = ioc.database;

describe('Movie Tests', async () => {

    beforeEach(async () => {
        await testUtils.initializeDatabase();
    });

    it ('get movies', async () => {
        const movies = await database.getMovies();

        expect(movies, 'movies output is null').to.exist;
        expect(movies.length).to.not.equal(0, 'movies.length is 0');
    });
});

describe('User Tests', async () => {

    beforeEach(async () => {
        await testUtils.initializeDatabase();
    });

    it('get nonexistent user', async () => {
        await testUtils.expectNullUser('fhfhdyryedhd');
    });

    it ('add new user directly to database', async () => {

        const username = testUtils.generateNewUsername();
        const password = 'p@$$w0rb';
        const salt = '123';

        await testUtils.expectNullUser(username);

        let user = {
            username: username,
            password: password,
            salt: salt
        };

        const userId = await database.addUser(user);

        expect(userId, 'user id should be non-null').to.exist;
        expect(userId.length).not.to.equal(0, 'user id should be more than zero length');

        //get user back out of DB
        user = await database.getUser(username);

        expect(user, 'new user should not be null').to.exist;
        expect(user.id).to.equal(userId, `user.id should equal ${userId}`);
        expect(user.username).to.equal(username, `user.username should equal ${username}`);
        expect(user.password).to.equal(password, `user.password should equal ${password}`);
        expect(user.salt).to.equal(salt, `user.salt should equal ${salt}`);
    });

    it('add and authenticate new user', async () => {
        const username = testUtils.generateNewUsername();
        const password = 'p@$$w0rb';

        await testUtils.expectNullUser(username);

        //add/authenticate user via auth
        const result = await auth.addOrAuthenticateUser(username, password);

        expect(result).not.to.equal(true, 'addOrAuthenticate should not return null');
        expect(result.token).not.to.equal(true, 'addOrAuthenticate should not return null auth token');

        //get user back out of DB
        const user = await database.getUser(username);

        expect(user, 'new user should not be null').to.exist;
        expect(user.id, 'user id should be non-null').to.exist;
        expect(user.username).to.equal(username, `user.username should equal ${username}`);
        expect(user.password).not.to.equal(password, `user.password should NOT equal ${password} (should be hashed)`);

        //make sure user is authenticated
        const isAuth = auth.userIsAuthenticated(username);

        expect(isAuth).to.equal(true, 'new user should be authenticated');
    });

    it ('cannot add duplicate user directly to database', async () => {
        const username = testUtils.generateNewUsername();
        const password = 'p@$$w0rb';
        const salt = '123';

        let user = await database.getUser(username)

        expect(user, 'test prereq failed: nonexistent user should be null').not.to.exist;

        user = {
            username: username,
            password: password,
            salt: salt
        };

        //add the user and verify successful add
        const userId = await database.addUser(user);
        expect(userId, 'user id should be non-null').to.exist;
        expect(userId.length).not.to.equal(0, 'user id should be more than zero length');

        //verify that usercount > 0
        const userCount = await database.getUserCount();
        expect(userCount).is.greaterThan(0);

        //attempt again to add the user
        const userId2 = await database.addUser(user);

        expect(userId2).is.equal(userId);
        const userCount2 = await database.getUserCount();

        //number of users should not have changed
        expect(userCount2).is.equal(userCount);
    });

    it ('cannot add duplicate user through auth function ', async () => {
        const username = testUtils.generateNewUsername();
        const password = 'p@$$w0rb';

        //add the user and verify successful add
        await auth.addOrAuthenticateUser(username, password);
        const user = await database.getUser(username);
        expect(user.id, 'user id should be non-null').to.exist;
        expect(user.id.length).not.to.equal(0, 'user id should be more than zero length');

        //verify that usercount > 0
        const userCount = await database.getUserCount();
        expect(userCount).is.greaterThan(0);

        //attempt again to add the user
        await auth.addOrAuthenticateUser(username, password)
        const user2 = await database.getUser(username);

        expect(user2.id).is.equal(user.id);
        const userCount2 = await database.getUserCount();

        //number of users should not have changed
        expect(userCount2).is.equal(userCount);
    });
});

describe('GraphQL Client Tests', async () => {

    beforeEach(async () => {
        await testUtils.initializeDatabase();
        await testUtils.startServer();
    });

    it('get movies', async () => {
        const client = new GraphQLTestClient(testUtils.getServerUrl());
        const data = await client.getMovies();

        expect(data.movies, 'graphql query for movies returned nothing').to.exist;
        expect(data.movies.length).not.to.equal(0, 'movies returned should be more than 0');

        const movie = data.movies[0];
        expect(movie).to.have.property('title');
        expect(movie).to.have.property('year');
        expect(movie).to.have.property('rating');
        expect(movie).to.have.property('actors');
        expect(movie).to.have.property('directors');
        expect(movie.actors[0]).to.have.property('name');
        expect(movie.actors[0]).to.have.property('birthday');
        expect(movie.actors[0]).to.have.property('country');
        expect(movie.directors[0]).to.have.property('name');
        expect(movie.directors[0]).to.have.property('birthday');
        expect(movie.directors[0]).to.have.property('country');
    });

    it('create user', async () => {
        const client = new GraphQLTestClient(testUtils.getServerUrl());
        const username = testUtils.generateNewUsername();
        const password = 'p@$$w0rb';

        const data = await client.createUser(username, password);
        testUtils.testAuthOutput(data, 'createUser');
    });

    it('login user', async () => {
        const client = new GraphQLTestClient(testUtils.getServerUrl());
        const username = testUtils.generateNewUsername();
        const password = 'p@$$w0rb';

        const createUser = await client.createUser(username, password);
        testUtils.testAuthOutput(createUser, 'createUser');

        const login = await client.login(username, password);
        testUtils.testAuthOutput(login, 'login');
    });
});