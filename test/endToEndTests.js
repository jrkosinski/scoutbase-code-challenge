'use strict';

const testUtils = require('./testUtils');
const ioc = require('../lib/iocContainer');
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
        const client = new GraphQLTestClient(testUtils.getServerUrl());

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
        const client = new GraphQLTestClient(testUtils.getServerUrl());

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
        const client = new GraphQLTestClient(testUtils.getServerUrl());

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
     * when user is not authenticated, scoutbase_rating should not be retrievable
     */
    it('attempt to retrieve scoutbase_rating unauthenticated', async () => {
        const client = new GraphQLTestClient(testUtils.getServerUrl());

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
        const client = new GraphQLTestClient(testUtils.getServerUrl());

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

        expect(data2.movies[0]).to.have.property('scoutbase_rating');
        expect(data2.movies[0].scoutbase_rating).not.to.equal('NOT AUTHORIZED');
    });
});