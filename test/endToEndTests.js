'use strict';

/**
 * scoutbase-code-challenge
 * ------------------------
 * unit tests: end-to-end using real GraphQL requests against a running server.
 *
 * Author: John R. Kosinski
 * Date: 27 Aug 2019
 */

const testUtils = require('./testUtils');
const ioc = require('../lib/utils/iocContainer');
const GraphQLTestClient = require('./graphQLTestClient');

const expect  = require('chai').expect;

/**
 * end-to-end tests using a GraphQL client executing against the running apollo server.
 * e.g. movies, authentication, authorization, etc.
 */
describe('GraphQL Client Tests', async () => {

    beforeEach(async () => {
        await testUtils.initializeDatabase();
        await testUtils.startServer();
    });

    /**
     * get movies query (without auth) via the GraphQL client
     */
    it('get movies', async () => {
        //create client
        const client = new GraphQLTestClient(testUtils.getApolloServerUrl());

        //get movies
        const data = await client.getMovies();

        //tests
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

    /**
     * create a new user & authenticate via the GraphQL client (createUser mutation)
     */
    it('create user', async () => {
        //create client
        const client = new GraphQLTestClient(testUtils.getApolloServerUrl());

        //username & passwd
        const username = testUtils.generateNewUsername();
        const password = 'p@$$w0rb';

        //create user & test
        const data = await client.createUser(username, password);
        testUtils.testAuthOutput(data, 'createUser');
    });

    /**
     * authenticate an existing user via the GraphQL client (login mutation)
     */
    it('login user', async () => {
        //create client
        const client = new GraphQLTestClient(testUtils.getApolloServerUrl());

        //username & passwd
        const username = testUtils.generateNewUsername();
        const password = 'p@$$w0rb';

        //create new user
        const createUser = await client.createUser(username, password);
        testUtils.testAuthOutput(createUser, 'createUser');

        //authenticate user in separate step
        const login = await client.login(username, password);
        testUtils.testAuthOutput(login, 'login');
    });

    /**
     * if someone tries to log in using a nonexistent account, incorrect password, or
     * otherwise invalid inputs, it should fail
     */
    it('attempt invalid login', async () => {
        //create client
        const client = new GraphQLTestClient(testUtils.getApolloServerUrl());

        //username & passwd
        const username = testUtils.generateNewUsername();
        const password = 'p@$$w0rb';

        //attempt to login before creating user
        const login = await client.login(username, password);
        expect(login.login.token).not.to.exist;

        //create new user
        const createUser = await client.createUser(username, password);
        testUtils.testAuthOutput(createUser, 'createUser');

        //attempt to log in with incorrect password
        const login2 = await client.login(username, password + '0000');
        expect(login2.login.token).not.to.exist;

        //attempt to log in with null or empty inputs
        const login3 = await client.login('', '');
        expect(login3.login.token).not.to.exist;

        //authenticate user in separate step
        const login4 = await client.login(username, password);
        testUtils.testAuthOutput(login4, 'login');
    });

    /**
     * attempting to create a new user with invalid inputs, should fail
     */
    it('create user invalid inputs', async () => {
        //create client
        const client = new GraphQLTestClient(testUtils.getApolloServerUrl());

        //create new user
        const createUser = await client.createUser('', '');
        expect(createUser.createUser.token).not.to.exist;
    });

    /**
     * when user is not authenticated, scoutbase_rating should not be retrievable
     */
    it('attempt to retrieve scoutbase_rating unauthenticated', async () => {
        const client = new GraphQLTestClient(testUtils.getApolloServerUrl());

        //get movies without auth
        const data = await client.getMovies(true);

        //verify that scoutbase_rating is not returned
        expect(data.movies[0]).to.have.property('scoutbase_rating', 'NOT AUTHORIZED');
    });

    /**
     * when user IS authenticated, scoutbase_rating should be retrievable
     */
    it('attempt to retrieve scoutbase_rating authenticated', async () => {
        await testUtils.startServer();

        //create client
        const client = new GraphQLTestClient(testUtils.getApolloServerUrl());

        //username & password
        const username = testUtils.generateNewUsername();
        const password = 'p@$$w0rb';

        //get movies before auth
        const data = await client.getMovies(true);

        expect(data.movies[0]).to.have.property('scoutbase_rating', 'NOT AUTHORIZED');

        //authenticate user
        const auth = await client.createUser(username, password);
        testUtils.testAuthOutput(auth, 'createUser');

        //get movies after auth & compare
        const data2 = await client.getMovies(true, auth.createUser.token);
        const firstMovie = data2.movies[0];

        expect(firstMovie).to.have.property('scoutbase_rating');
        expect(firstMovie.scoutbase_rating).not.to.equal('NOT AUTHORIZED');

        //test that value is between 5 and 9
        const rating = parseFloat(firstMovie.scoutbase_rating);
        expect(isNaN(rating)).to.be.false;
        expect(rating >= 5).to.be.true;
        expect(rating <= 9).to.be.true;
    });
});