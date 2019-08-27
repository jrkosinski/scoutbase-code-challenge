'use strict';

/**
 * scoutbase-code-challenge
 * ------------------------
 * implements a GraphQL client for testing.
 *
 * Author: John R. Kosinski
 * Date: 27 Aug 2019
 */

const {request, GraphQLClient} = require('graphql-request');

/**
 * a GraphQL client for testing.
 */
class GraphQLTestClient {
    constructor(url) {
        this.url = url;
    }

    /**
     * retrieves movies list
     *
     * @param {bool} includeScoutbaseRating if true include scoutbase_rating field in query
     * @param {authToken} string optional - pass when testing with authenticated user
     *
     * @returns {json} response from server
     */
    async /*json*/ getMovies(includeScoutbaseRating, authToken) {
        const query = `{
            movies {
                title
                year
                rating
                ${includeScoutbaseRating ? 'scoutbase_rating' : ''}
                actors {
                    name
                    birthday
                    country
                }
                directors {
                    name
                    birthday
                    country
                }
            }
        }`;

        if (authToken) {
            const client = new GraphQLClient(this.url, {
                headers: {
                    Authorization: authToken,
                }
            });

            return await client.request(query);
        }
        else {
            return await request(this.url, query);
        }
    }

    /**
     * runs the createUser mutation against the server
     *
     * @param {*} username
     * @param {*} password
     *
     * @returns {json} response from server
     */
    async /*json*/ createUser(username, password) {
        const mutation = `mutation createUser($username: String, $password: String) {
            createUser(username: $username, password:$password) {
              token
              user {
                id
                name
              }
            }
          }`;
        const values = { username, password };
        return await request(this.url, mutation, values);
    }

    /**
     * runs the login mutation against the server
     *
     * @param {*} username
     * @param {*} password
     *
     * @returns {json} response from server
     */
    async /*json*/ login(username, password) {
        const mutation = `mutation login($username: String, $password: String) {
            login(username: $username, password:$password) {
              token
              user {
                id
                name
              }
            }
          }`;
        const values = { username, password };
        return await request(this.url, mutation, values);
    }
}


module.exports = GraphQLTestClient;
