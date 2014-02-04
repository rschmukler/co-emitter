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


/**
 * Removes middlewares
 *
 * @param {String} name
 * @param {Function*} middleware
 * @return {undefined}
 * @api public
 */

CoMiddleware.prototype.removeMiddleware = function(name, middleware) {
  if(!name) {
    this._middlewares = {};
  } else if(!middleware) {
    delete this._middlewares[name];
  } else {
    var index = this._middlewares[name].indexOf(middleware);
    if(~index) this._middlewares[name].splice(index, 1);
  }
};

/**
 * Checks whether a middleware for a given name exists
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

CoMiddleware.prototype.hasMiddlewares = function(name) {
  return this._middlewares[name] && this._middlewares[name].length > 0 ? true : false;
};

/**
 * Returns an array of all middlewares for a given name
 *
 * @param {String} name
 * @return {Array}
 * @api public
 */

CoMiddleware.prototype.middlewares = function(name) {
  return this._middlewares[name] ? this._middlewares[name] : [];
};

module.exports = CoMiddleware;
