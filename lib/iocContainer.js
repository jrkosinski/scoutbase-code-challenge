'use strict';

/**
 * simple IOC container to serve our purposes
 */
class Container {
    constructor() {
        this.services = {};
    }

    /**
     * register a service by name, with the IOC container
     *
     * @param {string} serviceName
     * @param {fn} callback
     */
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