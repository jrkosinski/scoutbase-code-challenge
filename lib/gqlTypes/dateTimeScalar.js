'use strict' ;

/**
 * scoutbase-code-challenge
 * ------------------------
 * implements a custom scalar data type for outputting dates automatically as a
 * friendly string value in GraphQL (whereas they are stored in the DB as unix timestamps).
 *
 * Author: John R. Kosinski
 * Date: 27 Aug 2019
 */

const LOG_TAG = 'dtScalar';

const ioc = require('../utils/iocContainer');
const { GraphQLScalarType } = require('graphql');

const logger = ioc.loggerFactory.createLogger(LOG_TAG);
const exception = ioc.ehFactory.createHandler(logger);

/**
 * custom Date scalar data type that converts unix timestamp to date string on output.
 * It's used to format the birthday, which is stored in DB as a unix timestamp
 */
const DateTimeScalar = new GraphQLScalarType({
    name: 'DateTimeScalar',
    serialize: (value) => {
        return exception.try(() => {
            let output = null;
            if (value && !isNaN(value)) {
                output = new Date(value * 1000).toDateString();
            }
            else {
                logger.warn(`${value} is not a valid timestamp`);
            }
            return output;
        });
    },
    parseValue: (value) => {
        return value;
    },
    parseLiteral: (value) => {
        return value;
    },
});

exports.DateTimeScalar = DateTimeScalar;