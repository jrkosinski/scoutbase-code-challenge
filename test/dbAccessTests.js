'use strict';

/**
 * scoutbase-code-challenge
 * ------------------------
 * unit tests: direct database access.
 *
 * Author: John R. Kosinski
 * Date: 27 Aug 2019
 */

const testUtils = require('./testUtils');
const ioc = require('../lib/utils/iocContainer');

const expect  = require('chai').expect;
const database = ioc.database;

/**
 * tests of database reads and writes
 */
describe('Database Access Tests', async () => {

    beforeEach(async () => {
        await testUtils.initializeDatabase();
    });

    /**
     * simple movie query without authorization
     */
    it ('get movies', async () => {
        const movies = await database.getMovies();

        expect(movies, 'movies output is null').to.exist;
        expect(movies.length).to.not.equal(0, 'movies.length is 0');
    });

    /**
     * should receive null for nonexistent user query
     */
    it('get nonexistent user', async () => {
        await testUtils.expectNullUser('fhfhdyryedhd');
    });

    /**
     * should be able to add a new user in the database given the appropriate arguments
     */
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

    /**
     * once a user has been added, it should not be possible to add a user with a duplicate
     * username
     */
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
});
