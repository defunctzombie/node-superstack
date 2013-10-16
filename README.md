# superstack

long stack traces for node.js over async/io boundaries

## install

```shell
npm install superstack
```

## use

Just require `superstack` in your project. Ideally one of the first requires (see how it works for why)

```js
var superstack = require('superstack');
```

Your stack traces will now extend beyond async call boundaries.

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
