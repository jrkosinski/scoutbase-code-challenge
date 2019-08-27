'use strict';

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
     */
    async getMovies(includeScoutbaseRating, authToken) {
        const query = `{
            movies {
                title
                year
                rating
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

        return await request(this.url, query);
    }

    /**
     * runs the createUser mutation against the server
     *
     * @param {*} username
     * @param {*} password
     */
    async createUser(username, password) {
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
     */
    async login(username, password) {
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
