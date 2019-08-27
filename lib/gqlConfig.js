'use strict';

const LOG_TAG = 'gqlConfig';

const { ApolloServer } = require('apollo-server-express');
const ioc = require('./iocContainer');
const { AuthDirective } = require('./gqlTypes/authDirective');
const auth = require('./auth');

const database = ioc.database;
const logger = ioc.loggerFactory.createLogger(LOG_TAG)
const exception = ioc.ehFactory.createHandler(logger);


exports.initializeSchema = async () => {
    return await exception.tryAsync(async () => {

        // The GraphQL schema in string form
        const typeDefs = `
            directive @auth( authRequired: Boolean = true) on OBJECT | FIELD_DEFINITION
            scalar BigInt

            type User {
                id: String
                name: String
            }
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
                scoutbase_rating: String @auth(authRequired: true)
            }
            type AuthOutput {
                token: String
                user: User
            }
            type Query {
                movies: [Movie]
            }
            type Mutation {
                login(username: String, password:String): AuthOutput
                createUser(username: String, password:String): AuthOutput
            }
        `;

        // The resolvers
        const resolvers = {
            Query: { movies: async () => await database.getMovies() },
            Movie: {
                scoutbase_rating: () => {
                    let output = null;
                    return (Math.random() * (8 - 5 + 1.1) + 5).toFixed(1);
                }
            },
            Mutation: {
                createUser: (parent, args, context) => {
                    return auth.addOrAuthenticateUser(args.username, args.password);
                },
                login: (parent, args, context) => {
                    return auth.authenticateUser(args.username, args.password);
                }
            },
        };

        //apollo server
        const server = new ApolloServer({
            typeDefs: typeDefs,
            resolvers: resolvers,
            schemaDirectives: {
                auth: AuthDirective
            },
            context: async ({ req }) => {
                // get the user token from the headers
                const token = req.headers.authorization || '';

                if (token && token.length) {
                    logger.info(`token value is ${token}`);
                }

                // try to retrieve a user with the token
                const user = await auth.getUserByToken(token);

                // add the user to the context
                return { user };
            }
        });

        return server;
    });
};
