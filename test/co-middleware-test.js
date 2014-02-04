/* jshint esnext: true, noyield: true */
var expect = require('expect.js'),
    co = require('co');

var CoMiddleware = require('..');

describe('CoMiddleware', function() {
  describe('instantiation', function() {
    it('initializes _middlewares', function() {
      var middleware = new CoMiddleware();
      expect(middleware._middlewares).to.be.an(Object);
    });
  });

  describe('#middleware', function() {
    var middleware;
    beforeEach(function() {
      middleware = new CoMiddleware();
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
    it('runs the middlewares in the order registered', co(function* () {
      var firstCalled = false, secondCalled = false, thirdCalled = false;
      var first = function* () {
        expect(firstCalled).to.be(false);
        expect(secondCalled).to.be(false);
        expect(thirdCalled).to.be(false);
        firstCalled = true;
      };
      var second = function* () {
        expect(firstCalled).to.be(true);
        expect(secondCalled).to.be(false);
        expect(thirdCalled).to.be(false);
        secondCalled = true;
      };
      var third = function* () {
        expect(firstCalled).to.be(true);
        expect(secondCalled).to.be(true);
        expect(thirdCalled).to.be(false);
        thirdCalled = true;
      };
      var middleware = new CoMiddleware();
      middleware.middleware('helloWorld', [first, second, third]);

      yield middleware.run('helloWorld');

      expect(firstCalled).to.be(true);
      expect(secondCalled).to.be(true);
      expect(thirdCalled).to.be(true);
    }));

    it('waterfalls the results', co(function* () {
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

      var middleware = new CoMiddleware();
      middleware.middleware('test', [first, second, third]);
      var result = yield middleware.run('test', 'a', 'b');
      expect(result).to.be('yay');
    }));
  });

  describe('mixin', function() {
    it('works', function() {
      var proto = {};
      CoMiddleware(proto);
      expect(proto._middlewares).to.be.an(Object);
      expect(proto.middleware).to.be.a(Function);
      expect(proto.run).to.be.a(Function);
    });
  });
});
