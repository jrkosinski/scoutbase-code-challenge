'use strict';

const testUtils = require('./testUtils');
const ioc = require('../lib/iocContainer');
const auth = require('../lib/auth');

const expect  = require('chai').expect;
const database = ioc.database;

/**
 * tests of user creation, retrieval, and authentication, through the auth module
 */
describe('User Tests', async () => {

    beforeEach(async () => {
        await testUtils.initializeDatabase();
    });

    /**
     * should be able to add and authenticate a user in one step through auth module
     */
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

    /**
     * it should be impossible to add a duplicate of an existing user, via the auth module
     */
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
