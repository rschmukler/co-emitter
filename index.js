/* jshint esnext: true, noyield: true */
var co = require('co');

function CoMiddleware(obj) {
  this._middlewares = {};
  if(obj) mixin(obj);
}

/**
 * Mixes the co-middleware into the object
 *
 * @param {Object} obj
 * @return undefined
 * @api private
 */
function mixin(obj) {
  CoMiddleware.call(obj);
  for(var key in CoMiddleware.prototype) {
    obj[key] = CoMiddleware.prototype[key];
  }
}

/**
 * Register a generator for the given middleware name
 *
 * @param {String} name
 * @param {Function*} generator
 * @return {CoMiddleware}
 * @api public
 */

CoMiddleware.prototype.middleware = function() {
  var args = Array.prototype.slice.call(arguments),
      name = args.shift();

  var middlewares = this._middlewares[name] = this._middlewares[name] || [];

  if(Array.isArray(args[0])) {
    middlewares = this._middlewares[name] = middlewares.concat(args[0]);
  } else if(args.length > 1) {
    middlewares = this._middlewares[name] = middlewares.concat(args);
  } else {
    middlewares.push(args[0]);
  }
  return this;
};


/**
 * Runs all of the middlewares for a given name
 *
 * @param {String} name
 * @param {[args]} arguments
 * @return {CoMiddleware}
 * @api public
 */

CoMiddleware.prototype.run = function() {
  var args = Array.prototype.slice.call(arguments),
      name = args.shift(),
      self = this,
      middlewares = this._middlewares[name];

  return co(function *() {
    for(var i = 0; i < middlewares.length; ++i) {
      if(Array.isArray(args)) {
        args = yield middlewares[i].apply(self, args);
      } else {
        args = yield middlewares[i].call(self, args);
      }
    }
    return args;
  });
};


module.exports = CoMiddleware;
