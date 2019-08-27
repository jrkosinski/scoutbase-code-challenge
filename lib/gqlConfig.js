'use strict';

const LOG_TAG = 'gqlConfig';

const { ApolloServer } = require('apollo-server-express');
const ioc = require('./iocContainer');

const database = ioc.database;
const logger = ioc.loggerFactory.createLogger(LOG_TAG)
const exception = ioc.ehFactory.createHandler(logger);


exports.initializeSchema = async () => {
    return await exception.tryAsync(async () => {

        // The GraphQL schema in string form
        const typeDefs = `
            scalar BigInt

            type Person {
                name: String
                birthday: BigInt!
                country: String
            }
            type Movie  {
                title: String
                year: Int!
                rating: String
                actors: [Person]
                directors: [Person]
            }
            type Query {
                movies: [Movie]
            }
        `;

        // The resolvers
        const resolvers = {
            Query: { movies: async () => await database.getMovies() },
        };

        //apollo server
        const server = new ApolloServer({
            typeDefs: typeDefs,
            resolvers: resolvers,
        });

        return server;
    });
};
