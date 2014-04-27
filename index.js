/* jshint esnext: true, noyield: true */
function Emitter(obj) {
  this._callbacks = {};
  if(obj) mixin(obj);
}

/**
 * Mixes the co-emitter into the object
 *
 * @param {Object} obj
 * @return undefined
 * @api private
 */

function mixin(obj) {
  Emitter.call(obj);
  for(var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
}

/**
 * Register a generator for the given event
 *
 * @param {String} event
 * @param {Function*} generator
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = function() {
  var args = Array.prototype.slice.call(arguments),
      event = args.shift();

  var listeners = this.listeners(event);

  if(Array.isArray(args[0])) {
    listeners = listeners.concat(args[0]);
  } else if(args.length > 1) {
    listeners = listeners.concat(args);
  } else {
    listeners.push(args[0]);
  }
  this._callbacks[event] = listeners;
  return this;
};

/**
 * Register a generator for the given event that runs just once
 *
 * @param {String} event
 * @param {Function*} generator
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, listener) {
  var self = this;
  var remover = function*() {
    yield listener();
    self.off(event, remover);
  };
  this.on(event, remover);
};


/**
 * Runs all of the listeners for a given event
 *
 * @param {String} event
 * @param {[args]} arguments
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.emit = function *() {
  var args = Array.prototype.slice.call(arguments),
      event = args.shift(),
      listeners = this.listeners(event);

  for(var i = 0; i < listeners.length; ++i) {
    if(Array.isArray(args)) {
      args = (yield listeners[i].apply(this, args)) || args;
    } else {
      args = (yield listeners[i].call(this, args)) || args;
    }
  }
  return args.length == 1 ? args[0] : args;
};


/**
 * Removes Listener
 *
 * @param {String} event
 * @param {Function*} listener
 * @return {undefined}
 * @api public
 */

Emitter.prototype.off = function(event, listener) {
  if(!event) {
    this._callbacks = {};
  } else if(!listener) {
    delete this._callbacks[event];
  } else {
    var index = this._callbacks[event].indexOf(listener);
    if(~index) this._callbacks[event].splice(index, 1);
  }
};

/**
 * Checks whether a listener exists for a given event
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event) {
  return this.listeners(event).length > 0;
};

/**
 * Returns an array of all listeners for a given event
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event) {
  return this._callbacks[event] ? this._callbacks[event] : [];
};

module.exports = Emitter;
