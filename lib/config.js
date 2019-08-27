'use strict';

exports.httpPort = () => parseInt(process.env.HTTP_PORT);
exports.environment = () => process.env.NODE_ENV;
exports.isProd = () => (process.env.NODE_ENV === 'production');
exports.isDev = () => (process.env.NODE_ENV === 'development');