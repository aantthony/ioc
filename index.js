const annotate = require('fn-annotate');

/**
 * Creates an object containing an instantiated singleton instance for every factory.
 * Services are lazily instantiated as necessary (i.e. when the
 * returned object's getter is accessed).
 *
 * @private
 * @param  {Object} factories - key is service name, value is service constructor.
 * @return {Object} services (key is service name, value is singleton service instance)
 */
function createContainer(factories) {
  const instantiated = {};
  function get(name, fromModule) {
    const module = { name };
    if (instantiated[name]) return instantiated[name];
    const ctor = factories[name];
    if (!ctor) throw new Error(`Unknown dependency: ${fromModule.name || '()'} -> ${name}.`);
    const defintionArgs = annotate(ctor);
    const argumentValues = defintionArgs.map((argumentName) => {
      if (Array.isArray(argumentName)) {
        return argumentName.reduce((obj, key) => {
          if (key === 'module') {
            obj[key] = fromModule;
          } else {
            obj[key] = get(key, module);
          }
          return obj;
        }, {});
      }
      if (argumentName === 'module') return fromModule;
      return get(argumentName, module);
    });

    const instance = Object.create(ctor.prototype || {});
    const value = ctor.apply(instance, argumentValues) || instance;
    if (!ctor.transient) {
      instantiated[name] = value;
    }
    return value;
  }

  const container = {};
  Object.keys(factories).forEach((key) => {
    Object.defineProperty(container, key, {
      enumerable: true,
      get() { return get(key, { name: '(root)' }); },
    });
  });
  return container;
}

createContainer.transient = function (fn) {
  fn.transient = true;
  return fn;
};

module.exports = createContainer;
