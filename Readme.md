# co-emitter
co-powered emitter mixin for objects
[![Build Status](https://api.travis-ci.org/rschmukler/co-emitter.png)](http://travis-ci.org/rschmukler/co-emitter)

## Installation

```
npm install co-emitter
```

## API


### Emitter(obj)

The `Emitter` may be used as a mixin or a standalone object.

Standalone:

```js
var Emitter = require('co-emitter');
var emitter = new Emitter();

emitter.on('say', function *(message) {
  yield delay(200);
  console.log("I say: " + message);
  return true;
});

co(function *() {
  var result = yield emitter.emit('say', 'hello')
});
// result == true, and console.logs "I say: hello""
```

Mixin:

```js
var user = { name: 'Tobi' };
Emitter(user);
yield user.emit('some event');
```

Prototype mixin:

```js
var User = function() {
  this.name = 'Tobi';
};

Emitter(User.prototype);

var user = new User();
yield user.emit('some event');
```

### Emitter#on(name, fn\*, [...moreFns\*])

Registers generator as a listener for `name`.

`fn*` can be:
- a generator function
- an array of multiple generator functions (will be run in the order passed in)

```js
var emitter = new Emitter();
var listenerA = function *() {},
    listenerB = function *() {},
    listenerC = function *() {};

// All of these would be equal

emitter.on('test', listenerA);
emitter.on('test', listenerB);
emitter.on('test', listenerC);

// or

emitter.on('test', [listenerA, listenerB, listenerC]);

// or

emitter.on('test', listenerA, listenerB, listenerC);
```

### Emitter#once(name, fn\*, [...moreFns\*])

Registers generator as a listener for `name`. This generator runs once and is
then removed.

```js
var emitter = new Emitter();
emitter.once('test', function*() { console.log("Yay!"); });
yield emitter.emit('test');
```


### Emitter#emit(event, ...args)

Runs the registered listeners for `event`. Passes in optional `args` to the
listeners. 

`args` can be an array, or multiple arguments.

Returns the result of the last run listener. If results are omitted, returns
original arguments.

```js
var result = yield emitter.emit('add', 2, 2);
console.log(result) // 4
```

##### Async and Sync Sync Events

If you want an event to be synchronous, and not have to `yield` to
`emitter.emit`, you can do so by using normal functions for your listeners.

```js
var callCount = 0;
emitter.on('call', function() {
  callCount++;
});

emitter.emit('call');
emitter.emit('call');
```

If you wan't to wait for async operations to have finished, you may do so by
using `yield` within generators.

```js
emitter.on('saving', function *() {
  userStatistics.saveCount += 1;
  yield userStatistics.save();
});

// Elsewhere...
yield emitter.emit('saving'); // wait for `saving`'s async to have finished.
```

You may not use both generators and normal functions as listeners for a single
event. If you need async and sync for a single event, use a non-yielding
generator for the sync.

```js
emitter.on('saving', function*() {
  userStatistics.saveCount += 1;
});

emitter.on('saving', function *() {
  yield userStatistics.save();
});

// Elsewhere...
yield emitter.emit('saving'); // wait for `saving`'s async to have finished.
```

Because we are using one async function (or a generator), we must use `yield`
when calling `emit`.

##### Emitter chaining

Listeners run with a middleware pattern, results from one listener can be piped into the next. For example:

```js
var emitter = new Emitter();

var uppercase = function *(str) {
  return str.toUpperCase();
};

var firstChar = function *(str) {
  return str.charAt(0)
};

emitter.on('upperFirst', uppercase, firstChar);

var result = yield emitter.emit('upperFirst', 'hello world');
// result == 'H'
```

If you do not return a value, it will use the initial arguments passed in/ the
value of the last returning listener.

### Emitter#off([event], [listener])

Removes a given listener for a specific listener.

- If no `event` is provided, all listeners will be removed.
- If no `listener` is provided, all listeners for given `event` will be removed.
- If `event` and `listener` provided, removes `listener` from `event`

### Emitter#removeAllListeners

Convenience method to call off with no `event` or `listener`, thereby removing
all listeners.

### Emitter#hasListeners(event)

Returns whether or not any listeners exist for `event`.

### Emitter#listeners(event)

Returns an array of all listeners for a given `event`. If no listeners exist, returns an empty array.
