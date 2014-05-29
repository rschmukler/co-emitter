/* jshint esnext: true, noyield: true */
function Emitter(obj) {
  this._listeners = {};
  this._styles = {};
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

  var listeners = this._listeners[event] || [],
      add = function(listener) { this.on(event, listener); }.bind(this);

  this._listeners[event] = listeners;

  if(Array.isArray(args[0])) {
    args[0].forEach(add);
  } else if(args.length > 1) {
    args.forEach(add);
  } else {
    var listener = args[0],
        existingStyle = this._styles[event],
        style = this._styles[event] = isGenerator(listener) ? 'generator' : 'function';

    if(existingStyle && style !== existingStyle) {
      throw new Error('Cannot mix generator and function listeners');
    } else {
      this._styles[event] = style;
      listeners.push(listener);
    }
  }
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
  var self = this, remover;
  if(isGenerator(listener)) {
    remover = function*() {
      var args = Array.prototype.slice.call(arguments);
      yield listener.apply(this, args);
      self.off(event, remover);
    };
  } else {
    remover = function() {
      var args = Array.prototype.slice.call(arguments);
      listener.apply(this, args);
      self.off(event, remover);
    };
  }
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

Emitter.prototype.emit = function() {
  var args = Array.prototype.slice.call(arguments),
      event = args.shift(),
      listeners = this.listeners(event),
      style = this._styles[event];

  if(style == 'function') {
    for(var i = 0; i < listeners.length; ++i) {
        listeners[i].apply(this, args);
    }
    return undefined;
  } else {
    return function*() {
      for(var i = 0; i < listeners.length; ++i) {
        if(Array.isArray(args)) {
          args = (yield listeners[i].apply(this, args)) || args;
        } else {
          args = (yield listeners[i].call(this, args)) || args;
        }
      }
      return args.length == 1 ? args[0] : args;
    }.call(this);
  }
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
    this._listeners = {};
    this._styles = {};
  } else if(!listener) {
    delete this._listeners[event];
    delete this._styles[event];
  } else {
    var index = this._listeners[event].indexOf(listener);
    if(~index) this._listeners[event].splice(index, 1);
  }
};

/**
 * Removes All listeners
 *
 * @return {undefined}
 * @api public
 */

Emitter.prototype.removeAllListeners = function() {
  this.off();
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
  return this._listeners[event] ? this._listeners[event] : [];
};

module.exports = Emitter;

function isGenerator(fn) {
  return /^function\s*\*/.test(fn.toString());
};
