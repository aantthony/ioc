const annotate = require('fn-annotate');

function evaluateInjectionCall(ctor, dependencyProvider) {
  const defintionArgs = annotate(ctor);
  const argumentValues = defintionArgs.map((argumentName) => {
    if (Array.isArray(argumentName)) {
      return argumentName.reduce((obj, key) => {
        obj[key] = dependencyProvider(key);
        return obj;
      }, {});
    }
    return dependencyProvider(argumentName);
  });

  const instance = Object.create(ctor.prototype || {});
  const functionResult = ctor.apply(instance, argumentValues);

  /*
    If the function is a constructor (e.g. for use with the 'new' keyword),
    then returning undefined is expected, and we should use `instance`.
   */
  const value = (functionResult === undefined) ? instance : functionResult;
  return value;
}

/**
 * Creates an object containing an instantiated singleton instance for every factory.
 * Services are lazily instantiated as necessary (i.e. when the
 * returned object's getter is accessed).
 *
 * @param  {Object} factories - key is service name, value is service constructor.
 * @return {Object} services (key is service name, value is singleton service instance)
 */
function createContainer(factories) {
  const instantiated = {};

  function get(name, fromModule) {
    if (name === 'module') return fromModule;
    if (name === 'inject') {
      const injectModule = { name: '(inject)' };
      const provider = dep => get(dep, injectModule)
      return fn => evaluateInjectionCall(fn, provider);
    }

    if (instantiated[name]) return instantiated[name];

    const ctor = factories[name];
    if (!ctor) {
      throw new Error(`There is no definition for "${name}" which is a dependency of ${fromModule.name || '()'}.`);
    }
    const thisModule = { name };

    const value = evaluateInjectionCall(factories[name], dep => {
      if (dep === 'module') return fromModule;
      return get(dep, thisModule);
    });

    if (!ctor.transient) {
      // Store the instance
      instantiated[name] = value;
    }
    return value;
  }

  // container: { service1: [getter], service2: [getter], ...  }
  const container = {};
  const rootModule = { name: '(root)' };

  function addProperty(key) {
    Object.defineProperty(container, key, {
      enumerable: true,
      get() { return get(key, rootModule); },
    });
  }

  Object.keys(factories).forEach(addProperty);
  addProperty('module');
  addProperty('inject');

  return container;
}

createContainer.transient = function (fn) {
  fn.transient = true;
  return fn;
};

createContainer.env = function (values) {
  const obj = {};
  const env = values || process.env;
  return Object.keys(env).reduce((all, name) => {
    all[name] = () => env[name];
    return all;
  }, {});
};

module.exports = createContainer;
