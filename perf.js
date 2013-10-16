process.env.SUPERSTACK ? require('./') : '';

var assert = require('assert');

var EventEmitter = require('events').EventEmitter;

var count = 0;
var foobar = function() {
    count++;
};

var ev = new EventEmitter();
ev.on('foo', foobar);

var max = 1000000;

var start = process.hrtime();

for (var i=0 ; i<max ; ++i) {
    ev.emit('foo');
}

var diff = process.hrtime(start);
assert(count === max);

console.log('benchmark took %d seconds', (diff[0] * 1e9 + diff[1]) / 1e9);
console.log(process.memoryUsage());
