# superstack [![Build Status](https://travis-ci.org/defunctzombie/node-superstack.png?branch=master)](https://travis-ci.org/defunctzombie/node-superstack)

long stack traces for node.js over async/io boundaries

## install

```shell
npm install superstack
```

## use

Just require `superstack` in your project. Ideally one of the first requires (see how it works for why)

```js
var superstack = require('superstack');

function f () {
    throw new Error('foo');
}
setTimeout(f, Math.random());
setTimeout(f, Math.random());
```

Your stack traces will now extend beyond async call boundaries. From the code above.

Before superstack
```
Error: foo
    at f [as _onTimeout] (.../node-superstack/foobar.js:2:11)
    at Timer.listOnTimeout [as ontimeout] (timers.js:110:15)
```

We have no idea which `setTimeout` call actually caused the error.

After
```
Error: foo
    at f (/Users/shtylman/projects/node-superstack/foobar.js:4:11)
    at Timer.listOnTimeout [as ontimeout] (timers.js:110:15)
    at Object.<anonymous> (/Users/shtylman/projects/node-superstack/foobar.js:7:1)
    at Module._compile (module.js:456:26)
    at Object.Module._extensions..js (module.js:474:10)
    at Module.load (module.js:356:32)
    at Function.Module._load (module.js:312:12)
    at Function.Module.runMain (module.js:497:10)
    at startup (node.js:119:16)
    at node.js:901:3
```

Notice that the stacktrace identifies which of the two `setTimeout` fired first and this caused the error.

### options

#### superstack.empty_frame

By default, the stacktrace appears as one long stacktrace. If you want to see the superstack framing boundaries set this value to a string and it will appear in the callstack.

#### superstack.async_trace_limit

Set this to a positive number to limit the number of frames superstack will capture. This is how many nested async calls back to report. A values of `-1` means unlimited. Default is `10`.

#### superstack.format_stack

Function used by superstack to format the stacktrace string. See the implementation for default. The default conforms to the v8 stacktrace strings.

## how it works

Superstack works by intercepting certain node.js EventEmitter, process, and Timer APIs. By intercepting the api call and injecting a wrapper callback, any error can be captured and additional frame information added via [Error.prepareStackTrace](https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi)

The following calls are intercepted.

### EventEmitter

* on/addListener
* once
* removeListener
* listeners

### process

* nextTick
* _nextDomainTick

### globals

* setTimeout
* setInterval
* setImmediate

## testing

If you find an instance of usage that is not properly captured, please open an issue and provide a testcase to reproduce.

The usual `npm test` can be run. A more rigorous set of tests can be run by running the `runme.sh` script in `test/modules`. It will clone a few popular node.js repos and run their test suits with superstack enabled. This helps ensure that there are limited side effects.

## References

Thanks to [mattinsler/longjohn](https://github.com/mattinsler/longjohn) and [tlrobinson/long-stack-traces](https://github.com/tlrobinson/long-stack-traces) for the ideas and code. Longjohn code is MIT licensed.

Also relevant a pdf on the initial idea of [long stack traces](http://nodejs.org/illuminati0.pdf) via an EventSource.

## License

MIT
