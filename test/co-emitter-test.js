/* jshint esnext: true, noyield: true, newcap: false */
var expect = require('expect.js');

var co = require('co');

var Emitter = require('..');

describe('Emitter', () => {
  describe('instantiation', () => {
    it('initializes _listeners', () => {
      var emitter = new Emitter();
      expect(emitter._listeners).to.be.an(Object);
      expect(emitter._styles).to.be.an(Object);
    });
  });

  describe('#on', () => {
    var emitter;
    beforeEach(() => {
      emitter = new Emitter();
    });

    it('registers the listener', () => {
      var gen = function *() {};
      emitter.on('helloWorld', gen);
      expect(emitter._listeners).to.have.property('helloWorld');
      expect(emitter._listeners.helloWorld).to.have.length(1);
      expect(emitter._listeners.helloWorld[0]).to.be(gen);
    });

    it('sets style of event', function*() {
      emitter.on('fn', () => { } );
      expect(emitter._styles.fn).to.be('function');

      emitter.on('gen', function*() { } );
      expect(emitter._styles.gen).to.be('generator');
    });

  it('throws an error with conflicting styles', () => {
    var gen = function*() {};
    var fn = () => {};


    expect(conflictStyles).to.throwError('Cannot mix generator and function listeners');

    function conflictStyles() {
      emitter.on('woo', gen);
      emitter.on('woo', fn);
    }
  });

    it('can take an array', () => {
      var gen = function *() {};
      var genB = function *() {};

      emitter.on('helloWorld', [gen, genB]);
      expect(emitter._listeners).to.have.property('helloWorld');
      expect(emitter._listeners.helloWorld).to.have.length(2);
    });

    it('can take multiple listeners', () => {
      var gen = function *() {};
      var genB = function *() {};

      emitter.on('helloWorld', gen, genB);
      expect(emitter._listeners).to.have.property('helloWorld');
      expect(emitter._listeners.helloWorld).to.have.length(2);
    });

    it('appends listeners', () => {
      var gen = function *() {};
      var genB = function *() {};

      emitter.on('helloWorld', gen);
      emitter.on('helloWorld', genB);

      expect(emitter._listeners).to.have.property('helloWorld');
      expect(emitter._listeners.helloWorld).to.have.length(2);
      expect(emitter._listeners.helloWorld[0]).to.not.be(genB);
      expect(emitter._listeners.helloWorld[1]).to.be(genB);
    });

    it('returns the co-listener', () => {
      var gen = function *() {};
      var result = emitter.on('helloWorld', gen);
      expect(result).to.be(emitter);
    });
  });

  describe('once', () => {
    it('attaches a listener and removes it', co.wrap(function*() {
      var emitter = new Emitter();
      var count = 0;
      var gen = function *(arg) { expect(arg).to.be('a'); count++; };
      emitter.once('test', gen);
      yield emitter.emit('test', 'a');
      yield emitter.emit('test');
      expect(count).to.be(1);
    }));

    it('works for functions', co.wrap(function*() {
      var emitter = new Emitter();
      var count = 0;
      var listener = arg => { expect(arg).to.be('a'); count++; };
      emitter.once('test', listener);
      emitter.emit('test', 'a');
      emitter.emit('test');
      expect(count).to.be(1);
    }));
  });

  describe('emit', () => {
    describe('with functions', () => {
      it('emits the event on the listeners', done => {
        var emitter = new Emitter();
        emitter.on('test', val => {
          expect(val).to.be(1);
          done();
        });
        emitter.emit('test', 1);
      });
    });
    describe('with generators', () => {
      it('runs the listeners in the order registered', co.wrap(function *() {
        var firstCalled = false;
        var secondCalled = false;
        var thirdCalled = false;
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

      it('waterfalls the results', co.wrap(function *() {
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

      it('allows for listeners that dont return anything', co.wrap(function *() {
        var emitter = new Emitter();
        emitter.on('test', function* () { });
        var result = yield emitter.emit('test', 1, 2, 3);
        expect(result).to.eql([1, 2, 3]);
      }));

      it('returns the args if no listener exists', co.wrap(function *() {
        var emitter = new Emitter();
        var result = yield emitter.emit('bogus', 'a', 'b');
        expect(result[0]).to.be('a');
        expect(result[1]).to.be('b');
        result = yield emitter.emit('bogus', 'a');
        expect(result).to.be('a');
      }));
    });
  });


  describe('#off', () => {
    var emitter;
    var first;
    var second;

    beforeEach(() => {
      emitter = new Emitter();
      first = function *() {};
      second = function *() {};
      emitter.on('test', first, second);
      emitter.on('anotherTest', first);
    });

    it('removes all listeners if no name provided', () => {
      emitter.off();
      expect(emitter._listeners).to.eql({});
      expect(emitter._styles.test).to.be(undefined);
    });
    it('removes all listeners of name if name provided', () => {
      emitter.off('test');
      expect(emitter._listeners).to.eql({
        anotherTest: [first]
      });
      expect(emitter._styles.test).to.be(undefined);
    });
    it('removes specific listener if name and generator provided', () => {
      emitter.off('test', second);
      expect(emitter._listeners).to.eql({
        test: [first],
        anotherTest: [first]
      });
    });
  });

  describe('#removeAllListeners', () => {
    it('is a shortcut for off', () => {
      var emitter = new Emitter();
      var called = false;

      emitter.off = () => {
        called = true;
      };
      emitter.removeAllListeners();
      expect(called).to.be(true);
    });
  });

  describe('#hasListeners', () => {
    it('returns true if there is a listener registered for the event name', () => {
      var emitter = new Emitter();
      emitter.on('test', function *() {});
      expect(emitter.hasListeners('test')).to.be(true);
    });

    it('returns false if there is no listener registered for the event name', () => {
      var emitter = new Emitter();
      expect(emitter.hasListeners('test')).to.be(false);
    });
  });

  describe('#listeners', () => {
    it('returns all registered listeners for a event', () => {
      var emitter = new Emitter();
      var gen = function *() {};
      emitter.on('test', gen);
      expect(emitter.listeners('test')).to.be.eql([gen]);
    });

    it('returns an empty array if no listeners', () => {
      var emitter = new Emitter();
      expect(emitter.listeners('test')).to.be.eql([]);
    });
  });


  describe('mixin', () => {
    it('works', () => {
      var proto = {};
      Emitter(proto);
      expect(proto._listeners).to.be.an(Object);
      expect(proto.on).to.be.a(Function);
      expect(proto.emit).to.be.a(Function);
    });
  });
});
