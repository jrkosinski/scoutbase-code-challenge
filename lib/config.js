'use strict';

/**
 * utility to retrieve and interpret environment variables
 */

exports.httpPort = () => parseInt(process.env.HTTP_PORT);
exports.environment = () => process.env.NODE_ENV;
exports.mockDataUrl = () => process.env.MOCKDB_URL;
exports.isProd = () => (process.env.NODE_ENV === 'production');
exports.isDev = () => (process.env.NODE_ENV === 'development');