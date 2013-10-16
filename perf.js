process.env.SUPERSTACK ? require('./') : '';

var assert = require('assert');

var EventEmitter = require('events').EventEmitter;

var count = 0;
var foobar = function() {
    count++;
};

var start = process.hrtime();

var ev = new EventEmitter();
ev.setMaxListeners(0);

var io = 1000;
for (var i=0 ; i<io ; ++i) {
    ev.on('foo', foobar);
}

var max = 100000;

for (var i=0 ; i<max ; ++i) {
    ev.emit('foo');
}

var diff = process.hrtime(start);
assert(count === max * io);

console.log('benchmark took %d seconds', (diff[0] * 1e9 + diff[1]) / 1e9);
console.log(process.memoryUsage());
