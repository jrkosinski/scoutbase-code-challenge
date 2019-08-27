'use strict';

const LOG_TAG = 'gqlConfig';

const ioc = require('./utils/iocContainer');
const { ApolloServer } = require('apollo-server-express');
const { AuthDirective } = require('./gqlTypes/authDirective');
const { DateTimeScalar } = require('./gqlTypes/dateTimeScalar');
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
            scalar DateTimeScalar

            type User {
                id: String
                name: String
            }
            type Person {
                name: String
                birthday_timestamp: BigInt!
                birthday: DateTimeScalar
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
                    return (Math.random() * (8 - 5 + 1.1) + 5).toFixed(1);
                }
            },
            Person: {
                birthday: (parent) => {
                    return parent ? parent.birthday_timestamp : null;
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
            DateTimeScalar
        };

        //apollo server
        const server = new ApolloServer({
            typeDefs: typeDefs,
            resolvers: resolvers,
            schemaDirectives: {
                auth: AuthDirective
            },
            context: async ({ req }) => {
                return await exception.tryAsync(async () => {
                    // get the user token from the headers
                    const token = req.headers.authorization || '';

                    if (token && token.length) {
                        logger.info(`token value is ${token}`);

                        // try to retrieve a user with the token
                        const user = await auth.getUserByToken(token);

                        if (user) {
                            logger.info(`retrieved user ${user.id} using token`)
                        }
                        else {
                            logger.warn('unable to retrieve user using token');
                        }
                    }

                    // add the user to the context
                    return { user };
                });
            }
        });

        return server;
    });
};
