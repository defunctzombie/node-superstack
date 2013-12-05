var assert = require('assert');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var after = require('after');

var superstack = require('../');

superstack.empty_frame = '-----------------------------------';

test('normal throw', function() {
    assert.throws(function() {
        throw new Error('foobar');
    });
});

test('errors from other modules', function(done) {

    fs.readFile('not_there.txt', 'utf8', function (err, text) {
        assert(err instanceof Error);
        assert.equal(err.stack, 'Error: ENOENT, open \'not_there.txt\'');
        done();
    });
});

test('function inside timeout', function(done) {
    var a = function() {
        b();
    };

    var b = function() {
        assert.equal(new Error('this is uncaught!').stack.split(superstack.empty_frame).length, 2);
        done();
    }

    setTimeout(a, 0);
});

test('nested timeouts', function(done) {
    var a = function() {
        setTimeout(b, 0);
    }

    var b = function() {
        assert.equal(new Error('this is uncaught!').stack.split(superstack.empty_frame).length, 3);
        done();
    }

    setTimeout(a, 0);
});

test('trace limit', function(done) {
    superstack.async_trace_limit = 2;

    var counter = 0;
    var foo = function() {
        if (++counter > 3) {
            assert.equal(new Error('foo').stack.split(superstack.empty_frame).length, 2);
            return done();
        }
        setTimeout(foo, 1)
    }

    foo();
});

test('EventEmitter.on/emit', function() {
    var count = 0
    var foo = function() {
        ++count;
    }

    var emitter = new EventEmitter();

    emitter.on('foo', foo);
    emitter.on('foo', foo);
    emitter.on('foo', foo);
    emitter.emit('foo');
    assert.equal(count, 3);
});

test('EventEmitter.removeListener', function() {
    var count = 0
    var foo = function() {
        ++count;
    }

    var emitter = new EventEmitter();

    emitter.on('foo', foo);
    emitter.on('foo', foo);
    assert.equal(emitter.removeListener('foo', foo), emitter);

    emitter.emit('foo');
    assert.equal(count, 1);
});

test('EventEmitter.listeners', function() {
    var foo1 = function() { 'foo1'; }
    var foo2 = function() { 'foo2'; }

    var emitter = new EventEmitter();

    assert.equal(emitter.on('foo', foo1), emitter);
    assert.equal(emitter.on('foo', foo2), emitter);

    var listeners = emitter.listeners('foo');
    assert.equal(listeners.length, 2);
    assert.equal(listeners[0], foo1.toString());
    assert.equal(listeners[1], foo2.toString());
});

test('setTimeout', function(done) {
    var timeout_id = setTimeout(function() {
        assert.equal(new Error('foobar').stack.split(superstack.empty_frame).length, 2)
        assert.deepEqual(Array.prototype.slice.call(arguments), [1, 2, 3])
        done();
    }, 1, 1, 2, 3);
    assert(timeout_id);
});

test('setInterval', function(done) {
    var step = after(3, function() {
        clearInterval(interval_id);
        done();
    });

    var interval_id = setInterval(function() {
        assert.deepEqual(Array.prototype.slice.call(arguments), [1, 2, 3]);
        step();
    }, 5, 1, 2, 3);
    assert(interval_id);
});

if (global.setImmediate) {
    test('setImmediate', function(done) {
        var immediate_id = setImmediate(function() {
            assert.deepEqual(Array.prototype.slice.call(arguments), [1, 2, 3]);
            clearImmediate(immediate_id);
            done();
        }, 1, 2, 3);
    });
}
