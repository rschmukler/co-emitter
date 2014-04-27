/* jshint esnext: true, noyield: true, newcap: false */
var expect = require('expect.js'),
    co = require('co');

var Emitter = require('..');

describe('Emitter', function() {
  describe('instantiation', function() {
    it('initializes _callbacks', function() {
      var emitter = new Emitter();
      expect(emitter._callbacks).to.be.an(Object);
    });
  });

  describe('#on', function() {
    var emitter;
    beforeEach(function() {
      emitter = new Emitter();
    });

    it('registers the listener', function() {
      var gen = function *() {};
      emitter.on('helloWorld', gen);
      expect(emitter._callbacks).to.have.property('helloWorld');
      expect(emitter._callbacks.helloWorld).to.have.length(1);
      expect(emitter._callbacks.helloWorld[0]).to.be(gen);
    });

    it('can take an array', function() {
      var gen = function *() {},
          genB = function *() {};

      emitter.on('helloWorld', [gen, genB]);
      expect(emitter._callbacks).to.have.property('helloWorld');
      expect(emitter._callbacks.helloWorld).to.have.length(2);
    });

    it('can take multiple listeners', function() {
      var gen = function *() {},
          genB = function *() {};

      emitter.on('helloWorld', gen, genB);
      expect(emitter._callbacks).to.have.property('helloWorld');
      expect(emitter._callbacks.helloWorld).to.have.length(2);
    });

    it('appends listeners', function() {
      var gen = function *() {},
          genB = function *() {};
      emitter.on('helloWorld', gen);
      emitter.on('helloWorld', genB);
      expect(emitter._callbacks).to.have.property('helloWorld');
      expect(emitter._callbacks.helloWorld).to.have.length(2);
      expect(emitter._callbacks.helloWorld[0]).to.not.be(genB);
      expect(emitter._callbacks.helloWorld[1]).to.be(genB);
    });

    it('returns the co-listener', function() {
      var gen = function *() {};
      var result = emitter.on('helloWorld', gen);
      expect(result).to.be(emitter);
    });
  });

  describe('once', function() {
    it('attaches a listener and removes it', co(function*() {
      var emitter = new Emitter();
      var count = 0;
      var gen = function *() { count++; };
      emitter.once('test', gen);
      yield emitter.emit('test');
      yield emitter.emit('test');
      expect(count).to.be(1);
    }));
  });

  describe('emit', function() {
    it('runs the listeners in the order registered', co(function *() {
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
      var emitter = new Emitter();
      emitter.on('helloWorld', [first, second, third]);

      yield emitter.emit('helloWorld');

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

      var emitter = new Emitter();
      emitter.on('test', [first, second, third]);
      var result = yield emitter.emit('test', 'a', 'b');
      expect(result).to.be('yay');
    }));

    it('allows for listeners that dont return anything', co(function *() {
      var emitter = new Emitter();
      emitter.on('test', function* () { });
      var result = yield emitter.emit('test', 1, 2, 3);
      expect(result).to.eql([1, 2, 3]);
    }));

    it('returns the args if no listener exists', co(function *() {
      var emitter = new Emitter();
      var result = yield emitter.emit('bogus', 'a', 'b');
      expect(result[0]).to.be('a');
      expect(result[1]).to.be('b');
      result = yield emitter.emit('bogus', 'a');
      expect(result).to.be('a');
    }));
  });

  describe('#off', function() {
    var emitter, first, second;

    beforeEach(function() {
      emitter = new Emitter();
      first = function *() {};
      second = function *() {};
      emitter.on('test', first, second);
      emitter.on('anotherTest', first);
    });

    it('removes all listeners if no name provided', function() {
      emitter.off();
      expect(emitter._callbacks).to.eql({});
    });
    it('removes all listeners of name if name provided', function() {
      emitter.off('test');
      expect(emitter._callbacks).to.eql({
        anotherTest: [first]
      });
    });
    it('removes specific listener if name and generator provided', function() {
      emitter.off('test', second);
      expect(emitter._callbacks).to.eql({
        test: [first],
        anotherTest: [first]
      });
    });
  });

  describe('#hasListeners', function() {
    it('returns true if there is a listener registered for the event name', function() {
      var emitter = new Emitter();
      emitter.on('test', function *() {});
      expect(emitter.hasListeners('test')).to.be(true);
    });

    it('returns false if there is no listener registered for the event name', function() {
      var emitter = new Emitter();
      expect(emitter.hasListeners('test')).to.be(false);
    });
  });

  describe('#listeners', function() {
    it('returns all registered listeners for a event', function() {
      var emitter = new Emitter();
      var gen = function *() {};
      emitter.on('test', gen);
      expect(emitter.listeners('test')).to.be.eql([gen]);
    });

    it('returns an empty array if no listeners', function() {
      var emitter = new Emitter();
      expect(emitter.listeners('test')).to.be.eql([]);
    });
  });


  describe('mixin', function() {
    it('works', function() {
      var proto = {};
      Emitter(proto);
      expect(proto._callbacks).to.be.an(Object);
      expect(proto.on).to.be.a(Function);
      expect(proto.emit).to.be.a(Function);
    });
  });
});
