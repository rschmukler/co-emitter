# co-middleware
co-powered middleware mixin for objects
[![Build Status](https://api.travis-ci.org/rschmukler/co-middleware.png)](http://travis-ci.org/rschmukler/co-middleware)

## Installation

```
npm install co-middleware
```

## API


### CoMiddleware(obj)

The `CoMiddleware` may be used as a mixin or a standalone object.

Standalone:

```js
var CoMiddleware = require('co-middleware');
var middleware = new CoMiddleware();

middleware.middleware('say', function *(message) {
  yield delay(200);
  console.log("I say: " + message);
  return true;
});

var result = yield middleware.run('say', 'hello')
// result == true, and console.logs "I say: hello""
```

Mixin:

```js
var user = { name: 'Tobi' };
CoMiddleware(user);
user.run('some middleware');
```

Prototype mixin:

```js
var User = function() {
  this.name = 'Tobi';
};

CoMiddleware(User.prototype);

var user = new User();
user.run('some middleware');
```

### CoMiddleware#middleware(name, fn\*, [...moreFns\*])

Registers generator as a middleware for `name`.

`fn*` can be:
- a generator function
- an array of multiple generator functions (will be run in the order passed in)

```js
var middleware = new CoMiddleware();
var middlewareA = function *() {},
    middlewareB = function *() {},
    middlewareC = function *() {};

// All of these would be equal

middleware.middleware(middlewareA);
middleware.middleware(middlewareB);
middleware.middleware(middlewareC);

// or

middleware.middleware([middlewareA, middlewareB, middlewareC]);

// or

middleware.middleware(middlewareA, middlewareB, middlewareC);
```

### CoMiddleware#run(name, ...args)

Runs the registered middlewares for `name`. Passes in optional `args` to the middlewares. 
`args` can be an array, or multiple arguments.

Returns a thunk.

```js
var result = yield middleware.run('add', 2, 2);
console.log(result) // 4
```

##### Middleware chaining

As is implied by the middleware pattern, results from one middleware can be piped into the next. For example:

```js
var middleware = new CoMiddleware();

var uppercase = function *(str) {
  return str.toUpperCase();
};

var firstChar = function *(str) {
  return str.charAt(0)
};

middleware.middleware('upperFirst', uppercase, firstChar);

var result = yield middleware.run('upperFirst', 'hello world');
// result == 'H'
```

### CoMiddleware#removeMiddleware([name], [middleware])

Removes a given middleware for a specific name.

- If no `name` is provided, all middleware will be removed.
- If no `middleware` is provided, all middleware for given `name` will be removed.
- If `name` and `middleware` provided, removes `middleware` from `name`

### CoMiddleware#hasMiddlewares(name)

Returns whether or not any middleware exist for `name`.

### CoMiddleware#middlewares(name)

Returns an array of all middleware for a given name. If no middlewares exist, returns an empty array.
