var EventEmitter = require('events').EventEmitter;

var filename = __filename;
var current_trace_error = null;
var in_prepare = 0;

var ERROR_ID = 1;

// by default, the stacktrace output will appear as if a single long error stack
// if you want to split the stack with markers for the async boundaries,
// set this property to any string you wish to use
module.exports.empty_frame = undefined;

// the limit for how many async frames will be included in the stacktrace
module.exports.async_trace_limit = 10;

// called to create the callstack output string
module.exports.format_stack = function (err, frames) {
    var lines = [err.toString()];

    lines.push.apply(lines, frames.map(function(frame) {
        return '    at ' + frame.toString();
    }));

    return lines.join('\n');
}

// EmptyCallSite will be inserted into the stack frames
// at shim boundaries if empty_frame config string is set
// typical usage is to debug superstack framing of async calls
var EmptyCallSite = function() {
    if (!(this instanceof EmptyCallSite)) {
        return new EmptyCallSite();
    }
};

EmptyCallSite.prototype.toString = function() {
    return exports.empty_frame;
};

var prepareStackTrace = function(error, structured_stack_trace) {
    ++in_prepare;
    if (error.__cached_trace__ == null) {
        error.__cached_trace__ = structured_stack_trace.filter(function(frame) {
            return frame.getFileName() !== filename;
        });
        if (!error.__previous__ && in_prepare === 1) {
            error.__previous__ = current_trace_error;
        }
        if (error.__previous__) {
            var previous_stack = error.__previous__.stack;
            if (previous_stack && previous_stack.length > 0) {
                if (module.exports.empty_frame) {
                    error.__cached_trace__.push(EmptyCallSite());
                }
                var ref = error.__cached_trace__;
                ref.push.apply(ref, previous_stack);
            }
        }
    }

    --in_prepare;
    if (in_prepare > 0) {
        return error.__cached_trace__;
    }
    return module.exports.format_stack(error, error.__cached_trace__);
};

// truncate frames to async_trace_limit
var limit_frames = function(stack) {
    if (exports.async_trace_limit <= 0) {
        return;
    }

    var count = exports.async_trace_limit - 1;
    var previous = stack;

    while (previous && count > 1) {
        previous = previous.__previous__;
        --count;
    }

    if (previous) {
        delete previous.__previous__;
    }
};

// wrap a callback to capture any error or throw and thus the stacktrace
var wrap_callback = function(callback) {
    // capture current error location
    var trace_error = new Error();
    trace_error.id = ERROR_ID++;
    trace_error.__previous__ = current_trace_error;
    trace_error.__trace_count__ = current_trace_error ? current_trace_error.__trace_count__ + 1 : 1;
    limit_frames(trace_error);
    var new_callback = function() {
        current_trace_error = trace_error;
        trace_error = null;
        var res = callback.apply(this, arguments);
        current_trace_error = null;
        return res;
    };
    new_callback.__original_callback__ = callback;
    return new_callback;
};

/// EventEmitter shims

var addListener = EventEmitter.prototype.addListener;
var once = EventEmitter.prototype.once;
var removeListener = EventEmitter.prototype.removeListener;
var listeners = EventEmitter.prototype.listeners;

EventEmitter.prototype.addListener = function(event, callback) {
    var args = Array.prototype.slice.call(arguments);
    args[1] = wrap_callback(callback, 'EventEmitter.addListener');
    return addListener.apply(this, args);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(event, callback) {
    var args = Array.prototype.slice.call(arguments);
    args[1] = wrap_callback(callback, 'EventEmitter.once');
    return once.apply(this, args);
};

EventEmitter.prototype.removeListener = function(event, callback) {
    var self = this;
    var find_listener = function(callback) {
        var is_callback = function(val) {
            var poss1 = val.__original_callback__;
            var poss2 = val.listener;

            // poss1 is the callback or poss1 has a .listener with __orig that is the callback
            // or poss2 has __orig that is the callback
            return poss1 && (poss1 === callback || (poss1.listener && poss1.listener.__original_callback__ === callback)) || (poss2 && poss2.__original_callback__ === callback);
        };

        var handlers = listeners.call(self, event);
        if (!handlers) {
            return null;
        }
        // find the correct callback from the listeners array
        else if (Array.isArray(handlers)) {
            return handlers.filter(is_callback)[0];
        }
        else if (is_callback(handlers)) {
            return self._events[event];
        }

        return null;
    };

    var listener = find_listener(callback);
    if (!(listener && typeof listener === 'function')) {
        return self;
    }
    return removeListener.call(self, event, listener);
};

EventEmitter.prototype.listeners = function(event) {
    var self = this;
    var lists = listeners.call(self, event);
    return lists.map(function(listener) {
        return (listener.__original_callback__) ? listener.__original_callback__ : listener;
    });
};

/// process shims

var nextTick = process.nextTick;
var nextDomainTick = process._nextDomainTick;

process.nextTick = function(callback) {
    var args = Array.prototype.slice.call(arguments);
    args[0] = wrap_callback(callback, 'process.nextTick')
    return nextTick.apply(this, args)
};

process._nextDomainTick = function(callback) {
    var args = Array.prototype.slice.call(arguments);
    args[0] = wrap_callback(callback, 'process.nextDomainTick')
    return nextDomainTick.apply(this, args)
};

/// timeout shims

var setTimeout = global.setTimeout;
var setInterval = global.setInterval;
var setImmediate = global.setImmediate;

global.setTimeout = function(callback) {
    var args = Array.prototype.slice.call(arguments);
    args[0] = wrap_callback(callback, 'global.setTimeout')
    return setTimeout.apply(this, args);
};

global.setInterval = function(callback) {
    var args = Array.prototype.slice.call(arguments);
    args[0] = wrap_callback(callback, 'global.setInterval')
    return setInterval.apply(this, args);
};

// node >= 0.10
if (setImmediate) {
    global.setImmediate = function(callback) {
        var args = Array.prototype.slice.call(arguments);
        args[0] = wrap_callback(callback, 'global.setImmediate')
        return setImmediate.apply(this, args);
    };
}

Error.prepareStackTrace = prepareStackTrace;
