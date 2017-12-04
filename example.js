'use strict';

const ioc = require('./');
const createLogger = require('@aantthony/logger');

function createApplication() {
  return ioc({
    log: ioc.transient(module => createLogger(module.name)),
    x() { return 1; },
    y() { return 2; },
    z() { return 3; },
    example(x, y, z) {
      return x + y + z;
    },
    demo(example, log) {
      return {
        run() {
          log.info('Example = ' + example);
        }
      }
    },
    // anotherModule: require('./another-module'),
  });
};

module.exports = createApplication();

// 2017-12-04 11:15:47 demo: Example = 6
createApplication().demo.run();
