'use strict';

/**
 * scoutbase-code-challenge
 * ------------------------
 * utility to retrieve and interpret environment variables.
 *
 * Author: John R. Kosinski
 * Date: 27 Aug 2019
 */

exports.httpPort = () => parseInt(process.env.HTTP_PORT);
exports.mockDataUrl = () => process.env.MOCKDB_URL;
exports.mongodbConnection = () => process.env.MONGODB_CONNECTION;
exports.environment = () => process.env.NODE_ENV;
exports.isProd = () => (process.env.NODE_ENV === 'production');
exports.isDev = () => (process.env.NODE_ENV === 'development');