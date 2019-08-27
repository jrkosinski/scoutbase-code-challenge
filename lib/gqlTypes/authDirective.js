'use strict';

const LOG_TAG = 'authDir';

const { SchemaDirectiveVisitor } = require("graphql-tools");
const ioc = require('../iocContainer');

const logger = ioc.loggerFactory.createLogger(LOG_TAG)
const exception = ioc.ehFactory.createHandler(logger);

/**
 * uses the visitor pattern and extends graphql-tools SchemaDirectiveVisitor to
 * override resolution of a given field for the purposes of authorization checking.
 * For fields that require auth, the field will resolve only if valid auth is present
 * in the request context. Otherwise will return the string value "NOT AUTHORIZED".
 */
class AuthDirective extends SchemaDirectiveVisitor {
    visitObject(object) {}

    visitFieldDefinition(field) {
        exception.try(() => {

            field._authRequired = this.args.authRequired;
            const { resolve = defaultFieldResolver } = field;

            field.resolve = function (...args) {
                return exception.try(() => {

                    const context = args[2];

                    if (field._authRequired) {
                        if (!context || !context.user) {
                            return "NOT AUTHORIZED";
                        }
                    }

                    return resolve.apply(this, args);
                });
            }
        });
    }
}

exports.AuthDirective = AuthDirective;