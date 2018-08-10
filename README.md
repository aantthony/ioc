# ioc


## Installation

```sh
npm install --save "@aantthony/ioc"
```

## Usage

```js
const ioc = require('@aantthony/ioc');
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
```

## Built in modules:

### `module`
An object which describes the referring module.
NOTE: If a service depends on `module`, it must be explicitly declared as `ioc.transient()` as is shown in the above example code.
```js
{ name: 'exampleModule' }
```

### `inject`
Function which can be used to inject dependencies.

```js
// Executes the function with the dependencies injected.
inject((moduleA, moduleB) => {
  moduleA.doSomething();
  moduleB.doSomethingElse();
});
```
