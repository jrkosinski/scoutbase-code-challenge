'use strict';

/**
 * simple IOC container to serve our purposes
 */
class Container {
    constructor() {
        this.services = {};
    }

    service(serviceName, callback) {
        Object.defineProperty(this, serviceName, {
            get: () => {
                if (!this.services.hasOwnProperty(serviceName)) {
                    this.services[serviceName] = callback(this);
                }
                return this.services[serviceName];
            },
            configurable: true,
            enumerable: true
        });

        return this;
    }
}

//export singleton instance
const container = new Container();
module.exports = container;