/* jshint esnext: true, noyield: true */
var co = require('co');

function Middleware(obj) {
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
  Middleware.call(obj);
  for(var key in Middleware.prototype) {
    obj[key] = Middleware.prototype[key];
  }
}

/**
 * Register a generator for the given middleware name
 *
 * @param {String} name
 * @param {Function*} generator
 * @return {Middleware}
 * @api public
 */

Middleware.prototype.middleware = function() {
  var args = Array.prototype.slice.call(arguments),
      name = args.shift();

  var middlewares = this.middlewares(name);

  if(Array.isArray(args[0])) {
    middlewares = middlewares.concat(args[0]);
  } else if(args.length > 1) {
    middlewares = middlewares.concat(args);
  } else {
    middlewares.push(args[0]);
  }
  this._middlewares[name] = middlewares;
  return this;
};


/**
 * Runs all of the middlewares for a given name
 *
 * @param {String} name
 * @param {[args]} arguments
 * @return {Middleware}
 * @api public
 */

Middleware.prototype.run = function() {
  var args = Array.prototype.slice.call(arguments),
      name = args.shift(),
      self = this,
      middlewares = this.middlewares(name);

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

Middleware.prototype.removeMiddleware = function(name, middleware) {
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

Middleware.prototype.hasMiddlewares = function(name) {
  return this.middlewares(name).length > 0;
};

/**
 * Returns an array of all middlewares for a given name
 *
 * @param {String} name
 * @return {Array}
 * @api public
 */

Middleware.prototype.middlewares = function(name) {
  return this._middlewares[name] ? this._middlewares[name] : [];
};

module.exports = Middleware;
