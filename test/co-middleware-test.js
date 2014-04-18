/* jshint esnext: true, noyield: true, newcap: false */
var expect = require('expect.js'),
    co = require('co');

var Middleware = require('..');

describe('Middleware', function() {
  describe('instantiation', function() {
    it('initializes _middlewares', function() {
      var middleware = new Middleware();
      expect(middleware._middlewares).to.be.an(Object);
    });
  });

  describe('#middleware', function() {
    var middleware;
    beforeEach(function() {
      middleware = new Middleware();
    });

    it('registers the middleware', function() {
      var gen = function *() {};
      middleware.middleware('helloWorld', gen);
      expect(middleware._middlewares).to.have.property('helloWorld');
      expect(middleware._middlewares.helloWorld).to.have.length(1);
      expect(middleware._middlewares.helloWorld[0]).to.be(gen);
    });

    it('can take an array', function() {
      var gen = function *() {},
          genB = function *() {};

      middleware.middleware('helloWorld', [gen, genB]);
      expect(middleware._middlewares).to.have.property('helloWorld');
      expect(middleware._middlewares.helloWorld).to.have.length(2);
    });

    it('can take multiple middlewares', function() {
      var gen = function *() {},
          genB = function *() {};

      middleware.middleware('helloWorld', gen, genB);
      expect(middleware._middlewares).to.have.property('helloWorld');
      expect(middleware._middlewares.helloWorld).to.have.length(2);
    });

    it('appends middlewars', function() {
      var gen = function *() {},
          genB = function *() {};
      middleware.middleware('helloWorld', gen);
      middleware.middleware('helloWorld', genB);
      expect(middleware._middlewares).to.have.property('helloWorld');
      expect(middleware._middlewares.helloWorld).to.have.length(2);
      expect(middleware._middlewares.helloWorld[0]).to.not.be(genB);
      expect(middleware._middlewares.helloWorld[1]).to.be(genB);
    });

    it('returns the co-middleware', function() {
      var gen = function *() {};
      var result = middleware.middleware('helloWorld', gen);
      expect(result).to.be(middleware);
    });
  });

  describe('run', function() {
    it('runs the middlewares in the order registered', co(function *() {
      var firstCalled = false, secondCalled = false, thirdCalled = false;
      var first = function *() {
        expect(firstCalled).to.be(false);
        expect(secondCalled).to.be(false);
        expect(thirdCalled).to.be(false);
        firstCalled = true;
      };
      var second = function *() {
        expect(firstCalled).to.be(true);
        expect(secondCalled).to.be(false);
        expect(thirdCalled).to.be(false);
        secondCalled = true;
      };
      var third = function *() {
        expect(firstCalled).to.be(true);
        expect(secondCalled).to.be(true);
        expect(thirdCalled).to.be(false);
        thirdCalled = true;
      };
      var middleware = new Middleware();
      middleware.middleware('helloWorld', [first, second, third]);

      yield middleware.run('helloWorld');

      expect(firstCalled).to.be(true);
      expect(secondCalled).to.be(true);
      expect(thirdCalled).to.be(true);
    }));

    it('waterfalls the results', co(function *() {
      var first = function *(a, b) {
        expect(a).to.be('a');
        expect(b).to.be('b');
        return [1, 2];
      };
      var second = function *(a, b) {
        expect(a).to.be(1);
        expect(b).to.be(2);
        return 'woo';
      };

      var third = function *(a) {
        expect(a).to.be('woo');
        return 'yay';
      };

      var middleware = new Middleware();
      middleware.middleware('test', [first, second, third]);
      var result = yield middleware.run('test', 'a', 'b');
      expect(result).to.be('yay');
    }));

    it('allows for middlewares that dont return anything', co(function *() {
      var middleware = new Middleware();
      middleware.middleware('test', function* () { });
      var result = yield middleware.run('test', 1, 2, 3);
      expect(result).to.eql([1, 2, 3]);
    }));

    it('returns the args if no middleware exists', co(function *() {
      var middleware = new Middleware();
      var result = yield middleware.run('bogus', 'a', 'b');
      expect(result[0]).to.be('a');
      expect(result[1]).to.be('b');
      result = yield middleware.run('bogus', 'a');
      expect(result).to.be('a');
    }));
  });

  describe('#removeMiddleware', function() {
    var middleware, first, second;

    beforeEach(function() {
      middleware = new Middleware();
      first = function *() {};
      second = function *() {};
      middleware.middleware('test', first, second);
      middleware.middleware('anotherTest', first);
    });

    it('removes all midlewares if no name provided', function() {
      middleware.removeMiddleware();
      expect(middleware._middlewares).to.eql({});
    });
    it('removes all middlewares if name provided', function() {
      middleware.removeMiddleware('test');
      expect(middleware._middlewares).to.eql({
        anotherTest: [first]
      });
    });
    it('removes specific middleware if name and generator provided', function() {
      middleware.removeMiddleware('test', second);
      expect(middleware._middlewares).to.eql({
        test: [first],
        anotherTest: [first]
      });
    });
  });

  describe('#hasMiddlewares', function() {
    it('returns true if there is a middleware registered for the event name', function() {
      var middleware = new Middleware();
      middleware.middleware('test', function *() {});
      expect(middleware.hasMiddlewares('test')).to.be(true);
    });

    it('returns false if there is no middleware registered for the event name', function() {
      var middleware = new Middleware();
      expect(middleware.hasMiddlewares('test')).to.be(false);
    });
  });

  describe('#middlewares', function() {
    it('returns all registered middlewares for a name', function() {
      var middlewares = new Middleware();
      var gen = function *() {};
      middlewares.middleware('test', gen);
      expect(middlewares.middlewares('test')).to.be.eql([gen]);
    });

    it('returns an empty array if no middlewares', function() {
      var middlewares = new Middleware();
      expect(middlewares.middlewares('test')).to.be.eql([]);
    });
  });


  describe('mixin', function() {
    it('works', function() {
      var proto = {};
      Middleware(proto);
      expect(proto._middlewares).to.be.an(Object);
      expect(proto.middleware).to.be.a(Function);
      expect(proto.run).to.be.a(Function);
    });
  });
});
