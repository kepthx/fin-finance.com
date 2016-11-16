(function UMDish(name, context, definition, plugins) {
  context[name] = definition.call(context);
  for (var i = 0; i < plugins.length; i++) {
    plugins[i](context[name])
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = context[name];
  } else if (typeof define === "function" && define.amd) {
    define(function reference() { return context[name]; });
  }
})("Primus", this || {}, function wrapper() {
  var define, module, exports
    , Primus = (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

/**
 * Create a function that will cleanup the instance.
 *
 * @param {Array|String} keys Properties on the instance that needs to be cleared.
 * @param {Object} options Additional configuration.
 * @returns {Function} Destroy function
 * @api public
 */
module.exports = function demolish(keys, options) {
  var split = /[, ]+/;

  options = options ||  {};
  keys = keys || [];

  if ('string' === typeof keys) keys = keys.split(split);

  /**
   * Run addition cleanup hooks.
   *
   * @param {String} key Name of the clean up hook to run.
   * @param {Mixed} selfie Reference to the instance we're cleaning up.
   * @api private
   */
  function run(key, selfie) {
    if (!options[key]) return;
    if ('string' === typeof options[key]) options[key] = options[key].split(split);
    if ('function' === typeof options[key]) return options[key].call(selfie);

    for (var i = 0, type, what; i < options[key].length; i++) {
      what = options[key][i];
      type = typeof what;

      if ('function' === type) {
        what.call(selfie);
      } else if ('string' === type && 'function' === typeof selfie[what]) {
        selfie[what]();
      }
    }
  }

  /**
   * Destroy the instance completely and clean up all the existing references.
   *
   * @returns {Boolean}
   * @api public
   */
  return function destroy() {
    var selfie = this
      , i = 0
      , prop;

    if (selfie[keys[0]] === null) return false;
    run('before', selfie);

    for (; i < keys.length; i++) {
      prop = keys[i];

      if (selfie[prop]) {
        if ('function' === typeof selfie[prop].destroy) selfie[prop].destroy();
        selfie[prop] = null;
      }
    }

    if (selfie.emit) selfie.emit('destroy');
    run('after', selfie);

    return true;
  };
};

},{}],2:[function(_dereq_,module,exports){
'use strict';

/**
 * Returns a function that when invoked executes all the listeners of the
 * given event with the given arguments.
 *
 * @returns {Function} The function that emits all the things.
 * @api public
 */
module.exports = function emits() {
  var self = this
    , parser;

  for (var i = 0, l = arguments.length, args = new Array(l); i < l; i++) {
    args[i] = arguments[i];
  }

  //
  // If the last argument is a function, assume that it's a parser.
  //
  if ('function' !== typeof args[args.length - 1]) return function emitter() {
    for (var i = 0, l = arguments.length, arg = new Array(l); i < l; i++) {
      arg[i] = arguments[i];
    }

    return self.emit.apply(self, args.concat(arg));
  };

  parser = args.pop();

  /**
   * The actual function that emits the given event. It returns a boolean
   * indicating if the event was emitted.
   *
   * @returns {Boolean}
   * @api public
   */
  return function emitter() {
    for (var i = 0, l = arguments.length, arg = new Array(l + 1); i < l; i++) {
      arg[i + 1] = arguments[i];
    }

    /**
     * Async completion method for the parser.
     *
     * @param {Error} err Optional error when parsing failed.
     * @param {Mixed} returned Emit instructions.
     * @api private
     */
    arg[0] = function next(err, returned) {
      if (err) return self.emit('error', err);

      arg = returned === undefined
        ? arg.slice(1) : returned === null
          ? [] : returned;

      self.emit.apply(self, args.concat(arg));
    };

    parser.apply(self, arg);
    return true;
  };
};

},{}],3:[function(_dereq_,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @api private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {Mixed} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Boolean} exists Only check if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Remove the listeners of a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {Mixed} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
         listeners.fn === fn
      && (!once || listeners.once)
      && (!context || listeners.context === context)
    ) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
           listeners[i].fn !== fn
        || (once && !listeners[i].once)
        || (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {String|Symbol} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],4:[function(_dereq_,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],5:[function(_dereq_,module,exports){
'use strict';

var regex = new RegExp('^((?:\\d+)?\\.?\\d+) *('+ [
  'milliseconds?',
  'msecs?',
  'ms',
  'seconds?',
  'secs?',
  's',
  'minutes?',
  'mins?',
  'm',
  'hours?',
  'hrs?',
  'h',
  'days?',
  'd',
  'weeks?',
  'wks?',
  'w',
  'years?',
  'yrs?',
  'y'
].join('|') +')?$', 'i');

var second = 1000
  , minute = second * 60
  , hour = minute * 60
  , day = hour * 24
  , week = day * 7
  , year = day * 365;

/**
 * Parse a time string and return the number value of it.
 *
 * @param {String} ms Time string.
 * @returns {Number}
 * @api private
 */
module.exports = function millisecond(ms) {
  var type = typeof ms
    , amount
    , match;

  if ('number' === type) return ms;
  else if ('string' !== type || '0' === ms || !ms) return 0;
  else if (+ms) return +ms;

  //
  // We are vulnerable to the regular expression denial of service (ReDoS).
  // In order to mitigate this we don't parse the input string if it is too long.
  // See https://nodesecurity.io/advisories/46.
  //
  if (ms.length > 10000 || !(match = regex.exec(ms))) return 0;

  amount = parseFloat(match[1]);

  switch (match[2].toLowerCase()) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return amount * year;

    case 'weeks':
    case 'week':
    case 'wks':
    case 'wk':
    case 'w':
      return amount * week;

    case 'days':
    case 'day':
    case 'd':
      return amount * day;

    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return amount * hour;

    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return amount * minute;

    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return amount * second;

    default:
      return amount;
  }
};

},{}],6:[function(_dereq_,module,exports){
'use strict';

/**
 * Wrap callbacks to prevent double execution.
 *
 * @param {Function} fn Function that should only be called once.
 * @returns {Function} A wrapped callback which prevents execution.
 * @api public
 */
module.exports = function one(fn) {
  var called = 0
    , value;

  /**
   * The function that prevents double execution.
   *
   * @api private
   */
  function onetime() {
    if (called) return value;

    called = 1;
    value = fn.apply(this, arguments);
    fn = null;

    return value;
  }

  //
  // To make debugging more easy we want to use the name of the supplied
  // function. So when you look at the functions that are assigned to event
  // listeners you don't see a load of `onetime` functions but actually the
  // names of the functions that this module will call.
  //
  onetime.displayName = fn.displayName || fn.name || onetime.displayName || onetime.name;
  return onetime;
};

},{}],7:[function(_dereq_,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty;

/**
 * Simple query string parser.
 *
 * @param {String} query The query string that needs to be parsed.
 * @returns {Object}
 * @api public
 */
function querystring(query) {
  var parser = /([^=?&]+)=?([^&]*)/g
    , result = {}
    , part;

  //
  // Little nifty parsing hack, leverage the fact that RegExp.exec increments
  // the lastIndex property so we can continue executing this loop until we've
  // parsed all results.
  //
  for (;
    part = parser.exec(query);
    result[decodeURIComponent(part[1])] = decodeURIComponent(part[2])
  );

  return result;
}

/**
 * Transform a query string to an object.
 *
 * @param {Object} obj Object that should be transformed.
 * @param {String} prefix Optional prefix.
 * @returns {String}
 * @api public
 */
function querystringify(obj, prefix) {
  prefix = prefix || '';

  var pairs = [];

  //
  // Optionally prefix with a '?' if needed
  //
  if ('string' !== typeof prefix) prefix = '?';

  for (var key in obj) {
    if (has.call(obj, key)) {
      pairs.push(encodeURIComponent(key) +'='+ encodeURIComponent(obj[key]));
    }
  }

  return pairs.length ? prefix + pairs.join('&') : '';
}

//
// Expose the module.
//
exports.stringify = querystringify;
exports.parse = querystring;

},{}],8:[function(_dereq_,module,exports){
'use strict';

var EventEmitter = _dereq_('eventemitter3')
  , millisecond = _dereq_('millisecond')
  , destroy = _dereq_('demolish')
  , Tick = _dereq_('tick-tock')
  , one = _dereq_('one-time');

/**
 * Returns sane defaults about a given value.
 *
 * @param {String} name Name of property we want.
 * @param {Recovery} selfie Recovery instance that got created.
 * @param {Object} opts User supplied options we want to check.
 * @returns {Number} Some default value.
 * @api private
 */
function defaults(name, selfie, opts) {
  return millisecond(
    name in opts ? opts[name] : (name in selfie ? selfie[name] : Recovery[name])
  );
}

/**
 * Attempt to recover your connection with reconnection attempt.
 *
 * @constructor
 * @param {Object} options Configuration
 * @api public
 */
function Recovery(options) {
  var recovery = this;

  if (!(recovery instanceof Recovery)) return new Recovery(options);

  options = options || {};

  recovery.attempt = null;        // Stores the current reconnect attempt.
  recovery._fn = null;            // Stores the callback.

  recovery['reconnect timeout'] = defaults('reconnect timeout', recovery, options);
  recovery.retries = defaults('retries', recovery, options);
  recovery.factor = defaults('factor', recovery, options);
  recovery.max = defaults('max', recovery, options);
  recovery.min = defaults('min', recovery, options);
  recovery.timers = new Tick(recovery);
}

Recovery.prototype = new EventEmitter();
Recovery.prototype.constructor = Recovery;

Recovery['reconnect timeout'] = '30 seconds';  // Maximum time to wait for an answer.
Recovery.max = Infinity;                       // Maximum delay.
Recovery.min = '500 ms';                       // Minimum delay.
Recovery.retries = 10;                         // Maximum amount of retries.
Recovery.factor = 2;                           // Exponential back off factor.

/**
 * Start a new reconnect procedure.
 *
 * @returns {Recovery}
 * @api public
 */
Recovery.prototype.reconnect = function reconnect() {
  var recovery = this;

  return recovery.backoff(function backedoff(err, opts) {
    opts.duration = (+new Date()) - opts.start;

    if (err) return recovery.emit('reconnect failed', err, opts);

    recovery.emit('reconnected', opts);
  }, recovery.attempt);
};

/**
 * Exponential back off algorithm for retry operations. It uses a randomized
 * retry so we don't DDOS our server when it goes down under pressure.
 *
 * @param {Function} fn Callback to be called after the timeout.
 * @param {Object} opts Options for configuring the timeout.
 * @returns {Recovery}
 * @api private
 */
Recovery.prototype.backoff = function backoff(fn, opts) {
  var recovery = this;

  opts = opts || recovery.attempt || {};

  //
  // Bailout when we already have a back off process running. We shouldn't call
  // the callback then.
  //
  if (opts.backoff) return recovery;

  opts['reconnect timeout'] = defaults('reconnect timeout', recovery, opts);
  opts.retries = defaults('retries', recovery, opts);
  opts.factor = defaults('factor', recovery, opts);
  opts.max = defaults('max', recovery, opts);
  opts.min = defaults('min', recovery, opts);

  opts.start = +opts.start || +new Date();
  opts.duration = +opts.duration || 0;
  opts.attempt = +opts.attempt || 0;

  //
  // Bailout if we are about to make too much attempts.
  //
  if (opts.attempt === opts.retries) {
    fn.call(recovery, new Error('Unable to recover'), opts);
    return recovery;
  }

  //
  // Prevent duplicate back off attempts using the same options object and
  // increment our attempt as we're about to have another go at this thing.
  //
  opts.backoff = true;
  opts.attempt++;

  recovery.attempt = opts;

  //
  // Calculate the timeout, but make it randomly so we don't retry connections
  // at the same interval and defeat the purpose. This exponential back off is
  // based on the work of:
  //
  // http://dthain.blogspot.nl/2009/02/exponential-backoff-in-distributed.html
  //
  opts.scheduled = opts.attempt !== 1
    ? Math.min(Math.round(
        (Math.random() + 1) * opts.min * Math.pow(opts.factor, opts.attempt - 1)
      ), opts.max)
    : opts.min;

  recovery.timers.setTimeout('reconnect', function delay() {
    opts.duration = (+new Date()) - opts.start;
    opts.backoff = false;
    recovery.timers.clear('reconnect, timeout');

    //
    // Create a `one` function which can only be called once. So we can use the
    // same function for different types of invocations to create a much better
    // and usable API.
    //
    var connect = recovery._fn = one(function connect(err) {
      recovery.reset();

      if (err) return recovery.backoff(fn, opts);

      fn.call(recovery, undefined, opts);
    });

    recovery.emit('reconnect', opts, connect);
    recovery.timers.setTimeout('timeout', function timeout() {
      var err = new Error('Failed to reconnect in a timely manner');
      opts.duration = (+new Date()) - opts.start;

      recovery.emit('reconnect timeout', err, opts);
      connect(err);
    }, opts['reconnect timeout']);
  }, opts.scheduled);

  //
  // Emit a `reconnecting` event with current reconnect options. This allows
  // them to update the UI and provide their users with feedback.
  //
  recovery.emit('reconnect scheduled', opts);

  return recovery;
};

/**
 * Check if the reconnection process is currently reconnecting.
 *
 * @returns {Boolean}
 * @api public
 */
Recovery.prototype.reconnecting = function reconnecting() {
  return !!this.attempt;
};

/**
 * Tell our reconnection procedure that we're passed.
 *
 * @param {Error} err Reconnection failed.
 * @returns {Recovery}
 * @api public
 */
Recovery.prototype.reconnected = function reconnected(err) {
  if (this._fn) this._fn(err);
  return this;
};

/**
 * Reset the reconnection attempt so it can be re-used again.
 *
 * @returns {Recovery}
 * @api public
 */
Recovery.prototype.reset = function reset() {
  this._fn = this.attempt = null;
  this.timers.clear('reconnect, timeout');

  return this;
};

/**
 * Clean up the instance.
 *
 * @type {Function}
 * @returns {Boolean}
 * @api public
 */
Recovery.prototype.destroy = destroy('timers attempt _fn');

//
// Expose the module.
//
module.exports = Recovery;

},{"demolish":1,"eventemitter3":9,"millisecond":5,"one-time":6,"tick-tock":11}],9:[function(_dereq_,module,exports){
'use strict';

//
// We store our EE objects in a plain object whose properties are event names.
// If `Object.create(null)` is not supported we prefix the event names with a
// `~` to make sure that the built-in object properties are not overridden or
// used as an attack vector.
// We also assume that `Object.create(null)` is available when the event name
// is an ES6 Symbol.
//
var prefix = typeof Object.create !== 'function' ? '~' : false;

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} once Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Holds the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @param {Boolean} exists We only need to know if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events && this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Functon} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Mixed} context Only remove listeners matching this context.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return this;

  var listeners = this._events[evt]
    , events = [];

  if (fn) {
    if (listeners.fn) {
      if (
           listeners.fn !== fn
        || (once && !listeners.once)
        || (context && listeners.context !== context)
      ) {
        events.push(listeners);
      }
    } else {
      for (var i = 0, length = listeners.length; i < length; i++) {
        if (
             listeners[i].fn !== fn
          || (once && !listeners[i].once)
          || (context && listeners[i].context !== context)
        ) {
          events.push(listeners[i]);
        }
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[evt] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[prefix ? prefix + event : event];
  else this._events = prefix ? {} : Object.create(null);

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],10:[function(_dereq_,module,exports){
'use strict';

/**
 * Check if we're required to add a port number.
 *
 * @see https://url.spec.whatwg.org/#default-port
 * @param {Number|String} port Port number we need to check
 * @param {String} protocol Protocol we need to check against.
 * @returns {Boolean} Is it a default port for the given protocol
 * @api private
 */
module.exports = function required(port, protocol) {
  protocol = protocol.split(':')[0];
  port = +port;

  if (!port) return false;

  switch (protocol) {
    case 'http':
    case 'ws':
    return port !== 80;

    case 'https':
    case 'wss':
    return port !== 443;

    case 'ftp':
    return port !== 21;

    case 'gopher':
    return port !== 70;

    case 'file':
    return false;
  }

  return port !== 0;
};

},{}],11:[function(_dereq_,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , ms = _dereq_('millisecond');

/**
 * Timer instance.
 *
 * @constructor
 * @param {Object} timer New timer instance.
 * @param {Function} clear Clears the timer instance.
 * @param {Function} duration Duration of the timer.
 * @param {Function} fn The functions that need to be executed.
 * @api private
 */
function Timer(timer, clear, duration, fn) {
  this.start = +(new Date());
  this.duration = duration;
  this.clear = clear;
  this.timer = timer;
  this.fns = [fn];
}

/**
 * Calculate the time left for a given timer.
 *
 * @returns {Number} Time in milliseconds.
 * @api public
 */
Timer.prototype.remaining = function remaining() {
  return this.duration - this.taken();
};

/**
 * Calculate the amount of time it has taken since we've set the timer.
 *
 * @returns {Number}
 * @api public
 */
Timer.prototype.taken = function taken() {
  return +(new Date()) - this.start;
};

/**
 * Custom wrappers for the various of clear{whatever} functions. We cannot
 * invoke them directly as this will cause thrown errors in Google Chrome with
 * an Illegal Invocation Error
 *
 * @see #2
 * @type {Function}
 * @api private
 */
function unsetTimeout(id) { clearTimeout(id); }
function unsetInterval(id) { clearInterval(id); }
function unsetImmediate(id) { clearImmediate(id); }

/**
 * Simple timer management.
 *
 * @constructor
 * @param {Mixed} context Context of the callbacks that we execute.
 * @api public
 */
function Tick(context) {
  if (!(this instanceof Tick)) return new Tick(context);

  this.timers = {};
  this.context = context || this;
}

/**
 * Return a function which will just iterate over all assigned callbacks and
 * optionally clear the timers from memory if needed.
 *
 * @param {String} name Name of the timer we need to execute.
 * @param {Boolean} clear Also clear from memory.
 * @returns {Function}
 * @api private
 */
Tick.prototype.tock = function ticktock(name, clear) {
  var tock = this;

  return function tickedtock() {
    if (!(name in tock.timers)) return;

    var timer = tock.timers[name]
      , fns = timer.fns.slice()
      , l = fns.length
      , i = 0;

    if (clear) tock.clear(name);
    else tock.start = +new Date();

    for (; i < l; i++) {
      fns[i].call(tock.context);
    }
  };
};

/**
 * Add a new timeout.
 *
 * @param {String} name Name of the timer.
 * @param {Function} fn Completion callback.
 * @param {Mixed} time Duration of the timer.
 * @returns {Tick}
 * @api public
 */
Tick.prototype.setTimeout = function timeout(name, fn, time) {
  var tick = this
    , tock;

  if (tick.timers[name]) {
    tick.timers[name].fns.push(fn);
    return tick;
  }

  tock = ms(time);
  tick.timers[name] = new Timer(
    setTimeout(tick.tock(name, true), ms(time)),
    unsetTimeout,
    tock,
    fn
  );

  return tick;
};

/**
 * Add a new interval.
 *
 * @param {String} name Name of the timer.
 * @param {Function} fn Completion callback.
 * @param {Mixed} time Interval of the timer.
 * @returns {Tick}
 * @api public
 */
Tick.prototype.setInterval = function interval(name, fn, time) {
  var tick = this
    , tock;

  if (tick.timers[name]) {
    tick.timers[name].fns.push(fn);
    return tick;
  }

  tock = ms(time);
  tick.timers[name] = new Timer(
    setInterval(tick.tock(name), ms(time)),
    unsetInterval,
    tock,
    fn
  );

  return tick;
};

/**
 * Add a new setImmediate.
 *
 * @param {String} name Name of the timer.
 * @param {Function} fn Completion callback.
 * @returns {Tick}
 * @api public
 */
Tick.prototype.setImmediate = function immediate(name, fn) {
  var tick = this;

  if ('function' !== typeof setImmediate) return tick.setTimeout(name, fn, 0);

  if (tick.timers[name]) {
    tick.timers[name].fns.push(fn);
    return tick;
  }

  tick.timers[name] = new Timer(
    setImmediate(tick.tock(name, true)),
    unsetImmediate,
    0,
    fn
  );

  return tick;
};

/**
 * Check if we have a timer set.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api public
 */
Tick.prototype.active = function active(name) {
  return name in this.timers;
};

/**
 * Properly clean up all timeout references. If no arguments are supplied we
 * will attempt to clear every single timer that is present.
 *
 * @param {Arguments} ..args.. The names of the timeouts we need to clear
 * @returns {Tick}
 * @api public
 */
Tick.prototype.clear = function clear() {
  var args = arguments.length ? arguments : []
    , tick = this
    , timer, i, l;

  if (args.length === 1 && 'string' === typeof args[0]) {
    args = args[0].split(/[, ]+/);
  }

  if (!args.length) {
    for (timer in tick.timers) {
      if (has.call(tick.timers, timer)) args.push(timer);
    }
  }

  for (i = 0, l = args.length; i < l; i++) {
    timer = tick.timers[args[i]];

    if (!timer) continue;
    timer.clear(timer.timer);

    timer.fns = timer.timer = timer.clear = null;
    delete tick.timers[args[i]];
  }

  return tick;
};

/**
 * Adjust a timeout or interval to a new duration.
 *
 * @returns {Tick}
 * @api public
 */
Tick.prototype.adjust = function adjust(name, time) {
  var interval
    , tick = this
    , tock = ms(time)
    , timer = tick.timers[name];

  if (!timer) return tick;

  interval = timer.clear === unsetInterval;
  timer.clear(timer.timer);
  timer.start = +(new Date());
  timer.duration = tock;
  timer.timer = (interval ? setInterval : setTimeout)(tick.tock(name, !interval), tock);

  return tick;
};

/**
 * We will no longer use this module, prepare your self for global cleanups.
 *
 * @returns {Boolean}
 * @api public
 */
Tick.prototype.end = Tick.prototype.destroy = function end() {
  if (!this.context) return false;

  this.clear();
  this.context = this.timers = null;

  return true;
};

//
// Expose the timer factory.
//
Tick.Timer = Timer;
module.exports = Tick;

},{"millisecond":5}],12:[function(_dereq_,module,exports){
'use strict';

var required = _dereq_('requires-port')
  , lolcation = _dereq_('./lolcation')
  , qs = _dereq_('querystringify')
  , relativere = /^\/(?!\/)/
  , protocolre = /^([a-z][a-z0-9.+-]*:)?(\/\/)?([\S\s]*)/i;

/**
 * These are the parse instructions for the URL parsers, it informs the parser
 * about:
 *
 * 0. The char it Needs to parse, if it's a string it should be done using
 *    indexOf, RegExp using exec and NaN means set as current value.
 * 1. The property we should set when parsing this value.
 * 2. Indication if it's backwards or forward parsing, when set as number it's
 *    the value of extra chars that should be split off.
 * 3. Inherit from location if non existing in the parser.
 * 4. `toLowerCase` the resulting value.
 */
var instructions = [
  ['#', 'hash'],                        // Extract from the back.
  ['?', 'query'],                       // Extract from the back.
  ['/', 'pathname'],                    // Extract from the back.
  ['@', 'auth', 1],                     // Extract from the front.
  [NaN, 'host', undefined, 1, 1],       // Set left over value.
  [/:(\d+)$/, 'port'],                  // RegExp the back.
  [NaN, 'hostname', undefined, 1, 1]    // Set left over.
];

 /**
 * @typedef ProtocolExtract
 * @type Object
 * @property {String} protocol Protocol matched in the URL, in lowercase
 * @property {Boolean} slashes Indicates whether the protocol is followed by double slash ("//")
 * @property {String} rest     Rest of the URL that is not part of the protocol
 */

 /**
  * Extract protocol information from a URL with/without double slash ("//")
  *
  * @param  {String} address   URL we want to extract from.
  * @return {ProtocolExtract}  Extracted information
  * @api private
  */
function extractProtocol(address) {
  var match = protocolre.exec(address);

  return {
    protocol: match[1] ? match[1].toLowerCase() : '',
    slashes: !!match[2],
    rest: match[3] ? match[3] : ''
  };
}

/**
 * The actual URL instance. Instead of returning an object we've opted-in to
 * create an actual constructor as it's much more memory efficient and
 * faster and it pleases my OCD.
 *
 * @constructor
 * @param {String} address URL we want to parse.
 * @param {Object|String} location Location defaults for relative paths.
 * @param {Boolean|Function} parser Parser for the query string.
 * @api public
 */
function URL(address, location, parser) {
  if (!(this instanceof URL)) {
    return new URL(address, location, parser);
  }

  var relative = relativere.test(address)
    , parse, instruction, index, key
    , type = typeof location
    , url = this
    , extracted
    , i = 0;

  //
  // The following if statements allows this module two have compatibility with
  // 2 different API:
  //
  // 1. Node.js's `url.parse` api which accepts a URL, boolean as arguments
  //    where the boolean indicates that the query string should also be parsed.
  //
  // 2. The `URL` interface of the browser which accepts a URL, object as
  //    arguments. The supplied object will be used as default values / fall-back
  //    for relative paths.
  //
  if ('object' !== type && 'string' !== type) {
    parser = location;
    location = null;
  }

  if (parser && 'function' !== typeof parser) {
    parser = qs.parse;
  }

  location = lolcation(location);

  //
  // extract protocol information before running the instructions
  //
  extracted = extractProtocol(address);
  url.protocol = extracted.protocol || location.protocol || '';
  url.slashes = extracted.slashes || location.slashes;
  address = extracted.rest;

  for (; i < instructions.length; i++) {
    instruction = instructions[i];
    parse = instruction[0];
    key = instruction[1];

    if (parse !== parse) {
      url[key] = address;
    } else if ('string' === typeof parse) {
      if (~(index = address.indexOf(parse))) {
        if ('number' === typeof instruction[2]) {
          url[key] = address.slice(0, index);
          address = address.slice(index + instruction[2]);
        } else {
          url[key] = address.slice(index);
          address = address.slice(0, index);
        }
      }
    } else if (index = parse.exec(address)) {
      url[key] = index[1];
      address = address.slice(0, address.length - index[0].length);
    }

    url[key] = url[key] || (instruction[3] || ('port' === key && relative) ? location[key] || '' : '');

    //
    // Hostname, host and protocol should be lowercased so they can be used to
    // create a proper `origin`.
    //
    if (instruction[4]) {
      url[key] = url[key].toLowerCase();
    }
  }

  //
  // Also parse the supplied query string in to an object. If we're supplied
  // with a custom parser as function use that instead of the default build-in
  // parser.
  //
  if (parser) url.query = parser(url.query);

  //
  // We should not add port numbers if they are already the default port number
  // for a given protocol. As the host also contains the port number we're going
  // override it with the hostname which contains no port number.
  //
  if (!required(url.port, url.protocol)) {
    url.host = url.hostname;
    url.port = '';
  }

  //
  // Parse down the `auth` for the username and password.
  //
  url.username = url.password = '';
  if (url.auth) {
    instruction = url.auth.split(':');
    url.username = instruction[0] || '';
    url.password = instruction[1] || '';
  }

  //
  // The href is just the compiled result.
  //
  url.origin = url.protocol && url.host && url.protocol !== 'file:' ? url.protocol +'//'+ url.host : 'null';
  url.href = url.toString();
}

/**
 * This is convenience method for changing properties in the URL instance to
 * insure that they all propagate correctly.
 *
 * @param {String} part          Property we need to adjust.
 * @param {Mixed} value          The newly assigned value.
 * @param {Boolean|Function} fn  When setting the query, it will be the function used to parse
 *                               the query.
 *                               When setting the protocol, double slash will be removed from
 *                               the final url if it is true.
 * @returns {URL}
 * @api public
 */
URL.prototype.set = function set(part, value, fn) {
  var url = this;

  if ('query' === part) {
    if ('string' === typeof value && value.length) {
      value = (fn || qs.parse)(value);
    }

    url[part] = value;
  } else if ('port' === part) {
    url[part] = value;

    if (!required(value, url.protocol)) {
      url.host = url.hostname;
      url[part] = '';
    } else if (value) {
      url.host = url.hostname +':'+ value;
    }
  } else if ('hostname' === part) {
    url[part] = value;

    if (url.port) value += ':'+ url.port;
    url.host = value;
  } else if ('host' === part) {
    url[part] = value;

    if (/:\d+$/.test(value)) {
      value = value.split(':');
      url.port = value.pop();
      url.hostname = value.join(':');
    } else {
      url.hostname = value;
      url.port = '';
    }
  } else if ('protocol' === part) {
    url.protocol = value.toLowerCase();
    url.slashes = !fn;
  } else {
    url[part] = value;
  }

  for (var i = 0; i < instructions.length; i++) {
    var ins = instructions[i];

    if (ins[4]) {
      url[ins[1]] = url[ins[1]].toLowerCase();
    }
  }

  url.origin = url.protocol && url.host && url.protocol !== 'file:' ? url.protocol +'//'+ url.host : 'null';
  url.href = url.toString();

  return url;
};

/**
 * Transform the properties back in to a valid and full URL string.
 *
 * @param {Function} stringify Optional query stringify function.
 * @returns {String}
 * @api public
 */
URL.prototype.toString = function toString(stringify) {
  if (!stringify || 'function' !== typeof stringify) stringify = qs.stringify;

  var query
    , url = this
    , protocol = url.protocol;

  if (protocol && protocol.charAt(protocol.length - 1) !== ':') protocol += ':';

  var result = protocol + (url.slashes ? '//' : '');

  if (url.username) {
    result += url.username;
    if (url.password) result += ':'+ url.password;
    result += '@';
  }

  result += url.host + url.pathname;

  query = 'object' === typeof url.query ? stringify(url.query) : url.query;
  if (query) result += '?' !== query.charAt(0) ? '?'+ query : query;

  if (url.hash) result += url.hash;

  return result;
};

//
// Expose the URL parser and some additional properties that might be useful for
// others or testing.
//
URL.extractProtocol = extractProtocol;
URL.location = lolcation;
URL.qs = qs;

module.exports = URL;

},{"./lolcation":13,"querystringify":7,"requires-port":10}],13:[function(_dereq_,module,exports){
(function (global){
'use strict';

var slashes = /^[A-Za-z][A-Za-z0-9+-.]*:\/\//;

/**
 * These properties should not be copied or inherited from. This is only needed
 * for all non blob URL's as a blob URL does not include a hash, only the
 * origin.
 *
 * @type {Object}
 * @private
 */
var ignore = { hash: 1, query: 1 }
  , URL;

/**
 * The location object differs when your code is loaded through a normal page,
 * Worker or through a worker using a blob. And with the blobble begins the
 * trouble as the location object will contain the URL of the blob, not the
 * location of the page where our code is loaded in. The actual origin is
 * encoded in the `pathname` so we can thankfully generate a good "default"
 * location from it so we can generate proper relative URL's again.
 *
 * @param {Object|String} loc Optional default location object.
 * @returns {Object} lolcation object.
 * @api public
 */
module.exports = function lolcation(loc) {
  loc = loc || global.location || {};
  URL = URL || _dereq_('./');

  var finaldestination = {}
    , type = typeof loc
    , key;

  if ('blob:' === loc.protocol) {
    finaldestination = new URL(unescape(loc.pathname), {});
  } else if ('string' === type) {
    finaldestination = new URL(loc, {});
    for (key in ignore) delete finaldestination[key];
  } else if ('object' === type) {
    for (key in loc) {
      if (key in ignore) continue;
      finaldestination[key] = loc[key];
    }

    if (finaldestination.slashes === undefined) {
      finaldestination.slashes = slashes.test(loc.href);
    }
  }

  return finaldestination;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./":12}],14:[function(_dereq_,module,exports){
'use strict';

var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split('')
  , length = 64
  , map = {}
  , seed = 0
  , i = 0
  , prev;

/**
 * Return a string representing the specified number.
 *
 * @param {Number} num The number to convert.
 * @returns {String} The string representation of the number.
 * @api public
 */
function encode(num) {
  var encoded = '';

  do {
    encoded = alphabet[num % length] + encoded;
    num = Math.floor(num / length);
  } while (num > 0);

  return encoded;
}

/**
 * Return the integer value specified by the given string.
 *
 * @param {String} str The string to convert.
 * @returns {Number} The integer value represented by the string.
 * @api public
 */
function decode(str) {
  var decoded = 0;

  for (i = 0; i < str.length; i++) {
    decoded = decoded * length + map[str.charAt(i)];
  }

  return decoded;
}

/**
 * Yeast: A tiny growing id generator.
 *
 * @returns {String} A unique id.
 * @api public
 */
function yeast() {
  var now = encode(+new Date());

  if (now !== prev) return seed = 0, prev = now;
  return now +'.'+ encode(seed++);
}

//
// Map each character to its index.
//
for (; i < length; i++) map[alphabet[i]] = i;

//
// Expose the `yeast`, `encode` and `decode` functions.
//
yeast.encode = encode;
yeast.decode = decode;
module.exports = yeast;

},{}],15:[function(_dereq_,module,exports){
/*globals require, define */
'use strict';

var EventEmitter = _dereq_('eventemitter3')
  , TickTock = _dereq_('tick-tock')
  , Recovery = _dereq_('recovery')
  , qs = _dereq_('querystringify')
  , inherits = _dereq_('inherits')
  , destroy = _dereq_('demolish')
  , yeast = _dereq_('yeast')
  , u2028 = /\u2028/g
  , u2029 = /\u2029/g;

/**
 * Context assertion, ensure that some of our public Primus methods are called
 * with the correct context to ensure that
 *
 * @param {Primus} self The context of the function.
 * @param {String} method The method name.
 * @api private
 */
function context(self, method) {
  if (self instanceof Primus) return;

  var failure = new Error('Primus#'+ method + '\'s context should called with a Primus instance');

  if ('function' !== typeof self.listeners || !self.listeners('error').length) {
    throw failure;
  }

  self.emit('error', failure);
}

//
// Sets the default connection URL, it uses the default origin of the browser
// when supported but degrades for older browsers. In Node.js, we cannot guess
// where the user wants to connect to, so we just default to localhost.
//
var defaultUrl;

try {
  if (location.origin) {
    defaultUrl = location.origin;
  } else {
    defaultUrl = location.protocol +'//'+ location.host;
  }
} catch (e) {
  defaultUrl = 'http://127.0.0.1';
}

/**
 * Primus is a real-time library agnostic framework for establishing real-time
 * connections with servers.
 *
 * Options:
 * - reconnect, configuration for the reconnect process.
 * - manual, don't automatically call `.open` to start the connection.
 * - websockets, force the use of WebSockets, even when you should avoid them.
 * - timeout, connect timeout, server didn't respond in a timely manner.
 * - ping, The heartbeat interval for sending a ping packet to the server.
 * - pong, The heartbeat timeout for receiving a response to the ping.
 * - network, Use network events as leading method for network connection drops.
 * - strategy, Reconnection strategies.
 * - transport, Transport options.
 * - url, uri, The URL to use connect with the server.
 *
 * @constructor
 * @param {String} url The URL of your server.
 * @param {Object} options The configuration.
 * @api public
 */
function Primus(url, options) {
  if (!(this instanceof Primus)) return new Primus(url, options);

  Primus.Stream.call(this);

  if ('function' !== typeof this.client) {
    var message = 'The client library has not been compiled correctly, ' +
      'see https://github.com/primus/primus#client-library for more details';
    return this.critical(new Error(message));
  }

  if ('object' === typeof url) {
    options = url;
    url = options.url || options.uri || defaultUrl;
  } else {
    options = options || {};
  }

  var primus = this;

  // The maximum number of messages that can be placed in queue.
  options.queueSize = 'queueSize' in options ? options.queueSize : Infinity;

  // Connection timeout duration.
  options.timeout = 'timeout' in options ? options.timeout : 10e3;

  // Stores the back off configuration.
  options.reconnect = 'reconnect' in options ? options.reconnect : {};

  // Heartbeat ping interval.
  options.ping = 'ping' in options ? options.ping : 25000;

  // Heartbeat pong response timeout.
  options.pong = 'pong' in options ? options.pong : 10e3;

  // Reconnect strategies.
  options.strategy = 'strategy' in options ? options.strategy : [];

  // Custom transport options.
  options.transport = 'transport' in options ? options.transport : {};

  primus.buffer = [];                           // Stores premature send data.
  primus.writable = true;                       // Silly stream compatibility.
  primus.readable = true;                       // Silly stream compatibility.
  primus.url = primus.parse(url || defaultUrl); // Parse the URL to a readable format.
  primus.readyState = Primus.CLOSED;            // The readyState of the connection.
  primus.options = options;                     // Reference to the supplied options.
  primus.timers = new TickTock(this);           // Contains all our timers.
  primus.socket = null;                         // Reference to the internal connection.
  primus.latency = 0;                           // Latency between messages.
  primus.disconnect = false;                    // Did we receive a disconnect packet?
  primus.transport = options.transport;         // Transport options.
  primus.transformers = {                       // Message transformers.
    outgoing: [],
    incoming: []
  };

  //
  // Create our reconnection instance.
  //
  primus.recovery = new Recovery(options.reconnect);

  //
  // Parse the reconnection strategy. It can have the following strategies:
  //
  // - timeout: Reconnect when we have a network timeout.
  // - disconnect: Reconnect when we have an unexpected disconnect.
  // - online: Reconnect when we're back online.
  //
  if ('string' === typeof options.strategy) {
    options.strategy = options.strategy.split(/\s?\,\s?/g);
  }

  if (false === options.strategy) {
    //
    // Strategies are disabled, but we still need an empty array to join it in
    // to nothing.
    //
    options.strategy = [];
  } else if (!options.strategy.length) {
    options.strategy.push('disconnect', 'online');

    //
    // Timeout based reconnection should only be enabled conditionally. When
    // authorization is enabled it could trigger.
    //
    if (!this.authorization) options.strategy.push('timeout');
  }

  options.strategy = options.strategy.join(',').toLowerCase();

  //
  // Force the use of WebSockets, even when we've detected some potential
  // broken WebSocket implementation.
  //
  if ('websockets' in options) {
    primus.AVOID_WEBSOCKETS = !options.websockets;
  }

  //
  // Force or disable the use of NETWORK events as leading client side
  // disconnection detection.
  //
  if ('network' in options) {
    primus.NETWORK_EVENTS = options.network;
  }

  //
  // Check if the user wants to manually initialise a connection. If they don't,
  // we want to do it after a really small timeout so we give the users enough
  // time to listen for `error` events etc.
  //
  if (!options.manual) primus.timers.setTimeout('open', function open() {
    primus.timers.clear('open');
    primus.open();
  }, 0);

  primus.initialise(options);
}

/**
 * Simple require wrapper to make browserify, node and require.js play nice.
 *
 * @param {String} name The module to require.
 * @returns {Object|Undefined} The module that we required.
 * @api private
 */
Primus.requires = Primus.require = function requires(name) {
  if ('function' !== typeof _dereq_) return undefined;

  return !('function' === typeof define && define.amd)
    ? _dereq_(name)
    : undefined;
};

//
// It's possible that we're running in Node.js or in a Node.js compatible
// environment. In this cases we try to inherit from the Stream base class.
//
try {
  Primus.Stream = Primus.requires('stream');
} catch (e) { }

if (!Primus.Stream) Primus.Stream = EventEmitter;

inherits(Primus, Primus.Stream);

/**
 * Primus readyStates, used internally to set the correct ready state.
 *
 * @type {Number}
 * @private
 */
Primus.OPENING = 1;   // We're opening the connection.
Primus.CLOSED  = 2;   // No active connection.
Primus.OPEN    = 3;   // The connection is open.

/**
 * Are we working with a potentially broken WebSockets implementation? This
 * boolean can be used by transformers to remove `WebSockets` from their
 * supported transports.
 *
 * @type {Boolean}
 * @private
 */
Primus.prototype.AVOID_WEBSOCKETS = false;

/**
 * Some browsers support registering emitting `online` and `offline` events when
 * the connection has been dropped on the client. We're going to detect it in
 * a simple `try {} catch (e) {}` statement so we don't have to do complicated
 * feature detection.
 *
 * @type {Boolean}
 * @private
 */
Primus.prototype.NETWORK_EVENTS = false;
Primus.prototype.online = true;

try {
  if (
       Primus.prototype.NETWORK_EVENTS = 'onLine' in navigator
    && (window.addEventListener || document.body.attachEvent)
  ) {
    if (!navigator.onLine) {
      Primus.prototype.online = false;
    }
  }
} catch (e) { }

/**
 * The Ark contains all our plugins definitions. It's namespaced by
 * name => plugin.
 *
 * @type {Object}
 * @private
 */
Primus.prototype.ark = {};

/**
 * Simple emit wrapper that returns a function that emits an event once it's
 * called. This makes it easier for transports to emit specific events.
 *
 * @returns {Function} A function that will emit the event when called.
 * @api public
 */
Primus.prototype.emits = _dereq_('emits');

/**
 * Return the given plugin.
 *
 * @param {String} name The name of the plugin.
 * @returns {Object|undefined} The plugin or undefined.
 * @api public
 */
Primus.prototype.plugin = function plugin(name) {
  context(this, 'plugin');

  if (name) return this.ark[name];

  var plugins = {};

  for (name in this.ark) {
    plugins[name] = this.ark[name];
  }

  return plugins;
};

/**
 * Checks if the given event is an emitted event by Primus.
 *
 * @param {String} evt The event name.
 * @returns {Boolean} Indication of the event is reserved for internal use.
 * @api public
 */
Primus.prototype.reserved = function reserved(evt) {
  return (/^(incoming|outgoing)::/).test(evt)
  || evt in this.reserved.events;
};

/**
 * The actual events that are used by the client.
 *
 * @type {Object}
 * @public
 */
Primus.prototype.reserved.events = {
  'reconnect scheduled': 1,
  'reconnect timeout': 1,
  'readyStateChange': 1,
  'reconnect failed': 1,
  'reconnected': 1,
  'reconnect': 1,
  'offline': 1,
  'timeout': 1,
  'online': 1,
  'error': 1,
  'close': 1,
  'open': 1,
  'data': 1,
  'end': 1
};

/**
 * Initialise the Primus and setup all parsers and internal listeners.
 *
 * @param {Object} options The original options object.
 * @returns {Primus}
 * @api private
 */
Primus.prototype.initialise = function initialise(options) {
  var primus = this
    , start;

  primus.recovery
  .on('reconnected', primus.emits('reconnected'))
  .on('reconnect failed', primus.emits('reconnect failed', function failed(next) {
    primus.emit('end');
    next();
  }))
  .on('reconnect timeout', primus.emits('reconnect timeout'))
  .on('reconnect scheduled', primus.emits('reconnect scheduled'))
  .on('reconnect', primus.emits('reconnect', function reconnect(next) {
    primus.emit('outgoing::reconnect');
    next();
  }));

  primus.on('outgoing::open', function opening() {
    var readyState = primus.readyState;

    primus.readyState = Primus.OPENING;
    if (readyState !== primus.readyState) {
      primus.emit('readyStateChange', 'opening');
    }

    start = +new Date();
  });

  primus.on('incoming::open', function opened() {
    var readyState = primus.readyState;

    if (primus.recovery.reconnecting()) {
      primus.recovery.reconnected();
    }

    //
    // The connection has been opened so we should set our state to
    // (writ|read)able so our stream compatibility works as intended.
    //
    primus.writable = true;
    primus.readable = true;

    //
    // Make sure we are flagged as `online` as we've successfully opened the
    // connection.
    //
    if (!primus.online) {
      primus.online = true;
      primus.emit('online');
    }

    primus.readyState = Primus.OPEN;
    if (readyState !== primus.readyState) {
      primus.emit('readyStateChange', 'open');
    }

    primus.latency = +new Date() - start;
    primus.timers.clear('ping', 'pong');
    primus.heartbeat();

    if (primus.buffer.length) {
      var data = primus.buffer.slice()
        , length = data.length
        , i = 0;

      primus.buffer.length = 0;

      for (; i < length; i++) {
        primus._write(data[i]);
      }
    }

    primus.emit('open');
  });

  primus.on('incoming::pong', function pong(time) {
    primus.online = true;
    primus.timers.clear('pong');
    primus.heartbeat();

    primus.latency = (+new Date()) - time;
  });

  primus.on('incoming::error', function error(e) {
    var connect = primus.timers.active('connect')
      , err = e;

    //
    // When the error is not an Error instance we try to normalize it.
    //
    if ('string' === typeof e) {
      err = new Error(e);
    } else if (!(e instanceof Error) && 'object' === typeof e) {
      //
      // BrowserChannel and SockJS returns an object which contains some
      // details of the error. In order to have a proper error we "copy" the
      // details in an Error instance.
      //
      err = new Error(e.message || e.reason);
      for (var key in e) {
        if (Object.prototype.hasOwnProperty.call(e, key))
          err[key] = e[key];
      }
    }
    //
    // We're still doing a reconnect attempt, it could be that we failed to
    // connect because the server was down. Failing connect attempts should
    // always emit an `error` event instead of a `open` event.
    //
    //
    if (primus.recovery.reconnecting()) return primus.recovery.reconnected(err);
    if (primus.listeners('error').length) primus.emit('error', err);

    //
    // We received an error while connecting, this most likely the result of an
    // unauthorized access to the server.
    //
    if (connect) {
      if (~primus.options.strategy.indexOf('timeout')) {
        primus.recovery.reconnect();
      } else {
        primus.end();
      }
    }
  });

  primus.on('incoming::data', function message(raw) {
    primus.decoder(raw, function decoding(err, data) {
      //
      // Do a "safe" emit('error') when we fail to parse a message. We don't
      // want to throw here as listening to errors should be optional.
      //
      if (err) return primus.listeners('error').length && primus.emit('error', err);

      //
      // Handle all "primus::" prefixed protocol messages.
      //
      if (primus.protocol(data)) return;
      primus.transforms(primus, primus, 'incoming', data, raw);
    });
  });

  primus.on('incoming::end', function end() {
    var readyState = primus.readyState;

    //
    // This `end` started with the receiving of a primus::server::close packet
    // which indicated that the user/developer on the server closed the
    // connection and it was not a result of a network disruption. So we should
    // kill the connection without doing a reconnect.
    //
    if (primus.disconnect) {
      primus.disconnect = false;

      return primus.end();
    }

    //
    // Always set the readyState to closed, and if we're still connecting, close
    // the connection so we're sure that everything after this if statement block
    // is only executed because our readyState is set to `open`.
    //
    primus.readyState = Primus.CLOSED;
    if (readyState !== primus.readyState) {
      primus.emit('readyStateChange', 'end');
    }

    if (primus.timers.active('connect')) primus.end();
    if (readyState !== Primus.OPEN) {
      return primus.recovery.reconnecting()
        ? primus.recovery.reconnect()
        : false;
    }

    this.writable = false;
    this.readable = false;

    //
    // Clear all timers in case we're not going to reconnect.
    //
    this.timers.clear();

    //
    // Fire the `close` event as an indication of connection disruption.
    // This is also fired by `primus#end` so it is emitted in all cases.
    //
    primus.emit('close');

    //
    // The disconnect was unintentional, probably because the server has
    // shutdown, so if the reconnection is enabled start a reconnect procedure.
    //
    if (~primus.options.strategy.indexOf('disconnect')) {
      return primus.recovery.reconnect();
    }

    primus.emit('outgoing::end');
    primus.emit('end');
  });

  //
  // Setup the real-time client.
  //
  primus.client();

  //
  // Process the potential plugins.
  //
  for (var plugin in primus.ark) {
    primus.ark[plugin].call(primus, primus, options);
  }

  //
  // NOTE: The following code is only required if we're supporting network
  // events as it requires access to browser globals.
  //
  if (!primus.NETWORK_EVENTS) return primus;

  /**
   * Handler for offline notifications.
   *
   * @api private
   */
  primus.offlineHandler = function offline() {
    if (!primus.online) return; // Already or still offline, bailout.

    primus.online = false;
    primus.emit('offline');
    primus.end();

    //
    // It is certainly possible that we're in a reconnection loop and that the
    // user goes offline. In this case we want to kill the existing attempt so
    // when the user goes online, it will attempt to reconnect freshly again.
    //
    primus.recovery.reset();
  };

  /**
   * Handler for online notifications.
   *
   * @api private
   */
  primus.onlineHandler = function online() {
    if (primus.online) return; // Already or still online, bailout.

    primus.online = true;
    primus.emit('online');

    if (~primus.options.strategy.indexOf('online')) {
      primus.recovery.reconnect();
    }
  };

  if (window.addEventListener) {
    window.addEventListener('offline', primus.offlineHandler, false);
    window.addEventListener('online', primus.onlineHandler, false);
  } else if (document.body.attachEvent){
    document.body.attachEvent('onoffline', primus.offlineHandler);
    document.body.attachEvent('ononline', primus.onlineHandler);
  }

  return primus;
};

/**
 * Really dead simple protocol parser. We simply assume that every message that
 * is prefixed with `primus::` could be used as some sort of protocol definition
 * for Primus.
 *
 * @param {String} msg The data.
 * @returns {Boolean} Is a protocol message.
 * @api private
 */
Primus.prototype.protocol = function protocol(msg) {
  if (
       'string' !== typeof msg
    || msg.indexOf('primus::') !== 0
  ) return false;

  var last = msg.indexOf(':', 8)
    , value = msg.slice(last + 2);

  switch (msg.slice(8,  last)) {
    case 'pong':
      this.emit('incoming::pong', +value);
    break;

    case 'server':
      //
      // The server is closing the connection, forcefully disconnect so we don't
      // reconnect again.
      //
      if ('close' === value) {
        this.disconnect = true;
      }
    break;

    case 'id':
      this.emit('incoming::id', value);
    break;

    //
    // Unknown protocol, somebody is probably sending `primus::` prefixed
    // messages.
    //
    default:
      return false;
  }

  return true;
};

/**
 * Execute the set of message transformers from Primus on the incoming or
 * outgoing message.
 * This function and it's content should be in sync with Spark#transforms in
 * spark.js.
 *
 * @param {Primus} primus Reference to the Primus instance with message transformers.
 * @param {Spark|Primus} connection Connection that receives or sends data.
 * @param {String} type The type of message, 'incoming' or 'outgoing'.
 * @param {Mixed} data The data to send or that has been received.
 * @param {String} raw The raw encoded data.
 * @returns {Primus}
 * @api public
 */
Primus.prototype.transforms = function transforms(primus, connection, type, data, raw) {
  var packet = { data: data }
    , fns = primus.transformers[type];

  //
  // Iterate in series over the message transformers so we can allow optional
  // asynchronous execution of message transformers which could for example
  // retrieve additional data from the server, do extra decoding or even
  // message validation.
  //
  (function transform(index, done) {
    var transformer = fns[index++];

    if (!transformer) return done();

    if (1 === transformer.length) {
      if (false === transformer.call(connection, packet)) {
        //
        // When false is returned by an incoming transformer it means that's
        // being handled by the transformer and we should not emit the `data`
        // event.
        //
        return;
      }

      return transform(index, done);
    }

    transformer.call(connection, packet, function finished(err, arg) {
      if (err) return connection.emit('error', err);
      if (false === arg) return;

      transform(index, done);
    });
  }(0, function done() {
    //
    // We always emit 2 arguments for the data event, the first argument is the
    // parsed data and the second argument is the raw string that we received.
    // This allows you, for example, to do some validation on the parsed data
    // and then save the raw string in your database without the stringify
    // overhead.
    //
    if ('incoming' === type) return connection.emit('data', packet.data, raw);

    connection._write(packet.data);
  }));

  return this;
};

/**
 * Retrieve the current id from the server.
 *
 * @param {Function} fn Callback function.
 * @returns {Primus}
 * @api public
 */
Primus.prototype.id = function id(fn) {
  if (this.socket && this.socket.id) return fn(this.socket.id);

  this._write('primus::id::');
  return this.once('incoming::id', fn);
};

/**
 * Establish a connection with the server. When this function is called we
 * assume that we don't have any open connections. If you do call it when you
 * have a connection open, it could cause duplicate connections.
 *
 * @returns {Primus}
 * @api public
 */
Primus.prototype.open = function open() {
  context(this, 'open');

  //
  // Only start a `connection timeout` procedure if we're not reconnecting as
  // that shouldn't count as an initial connection. This should be started
  // before the connection is opened to capture failing connections and kill the
  // timeout.
  //
  if (!this.recovery.reconnecting() && this.options.timeout) this.timeout();

  this.emit('outgoing::open');
  return this;
};

/**
 * Send a new message.
 *
 * @param {Mixed} data The data that needs to be written.
 * @returns {Boolean} Always returns true as we don't support back pressure.
 * @api public
 */
Primus.prototype.write = function write(data) {
  context(this, 'write');
  this.transforms(this, this, 'outgoing', data);

  return true;
};

/**
 * The actual message writer.
 *
 * @param {Mixed} data The message that needs to be written.
 * @returns {Boolean} Successful write to the underlaying transport.
 * @api private
 */
Primus.prototype._write = function write(data) {
  var primus = this;

  //
  // The connection is closed, normally this would already be done in the
  // `spark.write` method, but as `_write` is used internally, we should also
  // add the same check here to prevent potential crashes by writing to a dead
  // socket.
  //
  if (Primus.OPEN !== primus.readyState) {
    //
    // If the buffer is at capacity, remove the first item.
    //
    if (this.buffer.length === this.options.queueSize) {
      this.buffer.splice(0, 1);
    }

    this.buffer.push(data);
    return false;
  }

  primus.encoder(data, function encoded(err, packet) {
    //
    // Do a "safe" emit('error') when we fail to parse a message. We don't
    // want to throw here as listening to errors should be optional.
    //
    if (err) return primus.listeners('error').length && primus.emit('error', err);

    //
    // Hack 1: \u2028 and \u2029 are allowed inside a JSON string, but JavaScript
    // defines them as newline separators. Unescaped control characters are not
    // allowed inside JSON strings, so this causes an error at parse time. We
    // work around this issue by escaping these characters. This can cause
    // errors with JSONP requests or if the string is just evaluated.
    //
    if ('string' === typeof packet) {
      if (~packet.indexOf('\u2028')) packet = packet.replace(u2028, '\\u2028');
      if (~packet.indexOf('\u2029')) packet = packet.replace(u2029, '\\u2029');
    }

    primus.emit('outgoing::data', packet);
  });

  return true;
};

/**
 * Send a new heartbeat over the connection to ensure that we're still
 * connected and our internet connection didn't drop. We cannot use server side
 * heartbeats for this unfortunately.
 *
 * @returns {Primus}
 * @api private
 */
Primus.prototype.heartbeat = function heartbeat() {
  var primus = this;

  if (!primus.options.ping) return primus;

  /**
   * Exterminate the connection as we've timed out.
   *
   * @api private
   */
  function pong() {
    primus.timers.clear('pong');

    //
    // The network events already captured the offline event.
    //
    if (!primus.online) return;

    primus.online = false;
    primus.emit('offline');
    primus.emit('incoming::end');
  }

  /**
   * We should send a ping message to the server.
   *
   * @api private
   */
  function ping() {
    var value = +new Date();

    primus.timers.clear('ping');
    primus._write('primus::ping::'+ value);
    primus.emit('outgoing::ping', value);
    primus.timers.setTimeout('pong', pong, primus.options.pong);
  }

  primus.timers.setTimeout('ping', ping, primus.options.ping);
  return this;
};

/**
 * Start a connection timeout.
 *
 * @returns {Primus}
 * @api private
 */
Primus.prototype.timeout = function timeout() {
  var primus = this;

  /**
   * Remove all references to the timeout listener as we've received an event
   * that can be used to determine state.
   *
   * @api private
   */
  function remove() {
    primus.removeListener('error', remove)
          .removeListener('open', remove)
          .removeListener('end', remove)
          .timers.clear('connect');
  }

  primus.timers.setTimeout('connect', function expired() {
    remove(); // Clean up old references.

    if (primus.readyState === Primus.OPEN || primus.recovery.reconnecting()) {
      return;
    }

    primus.emit('timeout');

    //
    // We failed to connect to the server.
    //
    if (~primus.options.strategy.indexOf('timeout')) {
      primus.recovery.reconnect();
    } else {
      primus.end();
    }
  }, primus.options.timeout);

  return primus.on('error', remove)
    .on('open', remove)
    .on('end', remove);
};

/**
 * Close the connection completely.
 *
 * @param {Mixed} data last packet of data.
 * @returns {Primus}
 * @api public
 */
Primus.prototype.end = function end(data) {
  context(this, 'end');

  if (
      this.readyState === Primus.CLOSED
    && !this.timers.active('connect')
    && !this.timers.active('open')
  ) {
    //
    // If we are reconnecting stop the reconnection procedure.
    //
    if (this.recovery.reconnecting()) {
      this.recovery.reset();
      this.emit('end');
    }

    return this;
  }

  if (data !== undefined) this.write(data);

  this.writable = false;
  this.readable = false;

  var readyState = this.readyState;
  this.readyState = Primus.CLOSED;

  if (readyState !== this.readyState) {
    this.emit('readyStateChange', 'end');
  }

  this.timers.clear();
  this.emit('outgoing::end');
  this.emit('close');
  this.emit('end');

  return this;
};

/**
 * Completely demolish the Primus instance and forcefully nuke all references.
 *
 * @returns {Boolean}
 * @api public
 */
Primus.prototype.destroy = destroy('url timers options recovery socket transport transformers', {
  before: 'end',
  after: ['removeAllListeners', function detach() {
    if (!this.NETWORK_EVENTS) return;

    if (window.addEventListener) {
      window.removeEventListener('offline', this.offlineHandler);
      window.removeEventListener('online', this.onlineHandler);
    } else if (document.body.attachEvent){
      document.body.detachEvent('onoffline', this.offlineHandler);
      document.body.detachEvent('ononline', this.onlineHandler);
    }
  }]
});

/**
 * Create a shallow clone of a given object.
 *
 * @param {Object} obj The object that needs to be cloned.
 * @returns {Object} Copy.
 * @api private
 */
Primus.prototype.clone = function clone(obj) {
  return this.merge({}, obj);
};

/**
 * Merge different objects in to one target object.
 *
 * @param {Object} target The object where everything should be merged in.
 * @returns {Object} Original target with all merged objects.
 * @api private
 */
Primus.prototype.merge = function merge(target) {
  for (var i = 1, key, obj; i < arguments.length; i++) {
    obj = arguments[i];

    for (key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key))
        target[key] = obj[key];
    }
  }

  return target;
};

/**
 * Parse the connection string.
 *
 * @type {Function}
 * @param {String} url Connection URL.
 * @returns {Object} Parsed connection.
 * @api private
 */
Primus.prototype.parse = _dereq_('url-parse');

/**
 * Parse a query string.
 *
 * @param {String} query The query string that needs to be parsed.
 * @returns {Object} Parsed query string.
 * @api private
 */
Primus.prototype.querystring = qs.parse;
/**
 * Transform a query string object back into string equiv.
 *
 * @param {Object} obj The query string object.
 * @returns {String}
 * @api private
 */
Primus.prototype.querystringify = qs.stringify;

/**
 * Generates a connection URI.
 *
 * @param {String} protocol The protocol that should used to crate the URI.
 * @returns {String|options} The URL.
 * @api private
 */
Primus.prototype.uri = function uri(options) {
  var url = this.url
    , server = []
    , qsa = false;

  //
  // Query strings are only allowed when we've received clearance for it.
  //
  if (options.query) qsa = true;

  options = options || {};
  options.protocol = 'protocol' in options
    ? options.protocol
    : 'http:';
  options.query = url.query && qsa
    ? url.query.slice(1)
    : false;
  options.secure = 'secure' in options
    ? options.secure
    : url.protocol === 'https:' || url.protocol === 'wss:';
  options.auth = 'auth' in options
    ? options.auth
    : url.auth;
  options.pathname = 'pathname' in options
    ? options.pathname
    : this.pathname;
  options.port = 'port' in options
    ? +options.port
    : +url.port || (options.secure ? 443 : 80);

  //
  // Allow transformation of the options before we construct a full URL from it.
  //
  this.emit('outgoing::url', options);

  //
  // We need to make sure that we create a unique connection URL every time to
  // prevent back forward cache from becoming an issue. We're doing this by
  // forcing an cache busting query string in to the URL.
  //
  var querystring = this.querystring(options.query || '');
  querystring._primuscb = yeast();
  options.query = this.querystringify(querystring);

  //
  // Automatically suffix the protocol so we can supply `ws:` and `http:` and
  // it gets transformed correctly.
  //
  server.push(options.secure ? options.protocol.replace(':', 's:') : options.protocol, '');

  server.push(options.auth ? options.auth +'@'+ url.host : url.host);

  //
  // Pathnames are optional as some Transformers would just use the pathname
  // directly.
  //
  if (options.pathname) server.push(options.pathname.slice(1));

  //
  // Optionally add a search query.
  //
  if (qsa) server[server.length - 1] += '?'+ options.query;
  else delete options.query;

  if (options.object) return options;
  return server.join('/');
};

/**
 * Register a new message transformer. This allows you to easily manipulate incoming
 * and outgoing data which is particularity handy for plugins that want to send
 * meta data together with the messages.
 *
 * @param {String} type Incoming or outgoing
 * @param {Function} fn A new message transformer.
 * @returns {Primus}
 * @api public
 */
Primus.prototype.transform = function transform(type, fn) {
  context(this, 'transform');

  if (!(type in this.transformers)) {
    return this.critical(new Error('Invalid transformer type'));
  }

  this.transformers[type].push(fn);
  return this;
};

/**
 * A critical error has occurred, if we have an `error` listener, emit it there.
 * If not, throw it, so we get a stack trace + proper error message.
 *
 * @param {Error} err The critical error.
 * @returns {Primus}
 * @api private
 */
Primus.prototype.critical = function critical(err) {
  if (this.listeners('error').length) {
    this.emit('error', err);
    return this;
  }

  throw err;
};

/**
 * Syntax sugar, adopt a Socket.IO like API.
 *
 * @param {String} url The URL we want to connect to.
 * @param {Object} options Connection options.
 * @returns {Primus}
 * @api public
 */
Primus.connect = function connect(url, options) {
  return new Primus(url, options);
};

//
// Expose the EventEmitter so it can be re-used by wrapping libraries we're also
// exposing the Stream interface.
//
Primus.EventEmitter = EventEmitter;

//
// These libraries are automatically inserted at the server-side using the
// Primus#library method.
//
Primus.prototype.client = function client() {
  var primus = this
    , socket;

  //
  // Select an available WebSocket factory.
  //
  var Factory = (function factory() {
    if ('undefined' !== typeof WebSocket) return WebSocket;
    if ('undefined' !== typeof MozWebSocket) return MozWebSocket;

    try { return Primus.requires('ws'); }
    catch (e) {}

    return undefined;
  })();

  if (!Factory) return primus.critical(new Error(
    'Missing required `ws` module. Please run `npm install --save ws`'
  ));

  //
  // Connect to the given URL.
  //
  primus.on('outgoing::open', function opening() {
    primus.emit('outgoing::end');

    //
    // FireFox will throw an error when we try to establish a connection from
    // a secure page to an unsecured WebSocket connection. This is inconsistent
    // behaviour between different browsers. This should ideally be solved in
    // Primus when we connect.
    //
    try {
      var prot = primus.url.protocol === 'ws+unix:' ? 'ws+unix:' : 'ws:'
        , qsa = prot === 'ws:';

      //
      // Only allow primus.transport object in Node.js, it will throw in
      // browsers with a TypeError if we supply to much arguments.
      //
      if (Factory.length === 3) {
        primus.socket = socket = new Factory(
          primus.uri({ protocol: prot, query: qsa }),   // URL
          [],                                           // Sub protocols
          primus.transport                              // options.
        );
      } else {
        primus.socket = socket = new Factory(primus.uri({
          protocol: prot,
          query: qsa
        }));

        socket.binaryType = 'arraybuffer';
      }
    } catch (e) { return primus.emit('error', e); }

    //
    // Setup the Event handlers.
    //
    socket.onopen = primus.emits('incoming::open');
    socket.onerror = primus.emits('incoming::error');
    socket.onclose = primus.emits('incoming::end');
    socket.onmessage = primus.emits('incoming::data', function parse(next, evt) {
      next(undefined, evt.data);
    });
  });

  //
  // We need to write a new message to the socket.
  //
  primus.on('outgoing::data', function write(message) {
    if (!socket || socket.readyState !== Factory.OPEN) return;

    try { socket.send(message); }
    catch (e) { primus.emit('incoming::error', e); }
  });

  //
  // Attempt to reconnect the socket.
  //
  primus.on('outgoing::reconnect', function reconnect() {
    primus.emit('outgoing::open');
  });

  //
  // We need to close the socket.
  //
  primus.on('outgoing::end', function close() {
    if (!socket) return;

    socket.onerror = socket.onopen = socket.onclose = socket.onmessage = function () {};
    socket.close();
    socket = null;
  });
};
Primus.prototype.authorization = false;
Primus.prototype.pathname = "/primus";
Primus.prototype.encoder = function encoder(data, fn) {
  var err;

  try { data = msgpack.encode(data); }
  catch (e) { err = e; }

  fn(err, data);
};
Primus.prototype.decoder = function decoder(data, fn) {
  var err;

  try {
    data = msgpack.decode(data instanceof ArrayBuffer ? new Uint8Array(data) : data);
  } catch (e) {
    err = e;
  }

  fn(err, data);
};
Primus.prototype.version = "6.0.3";

if (
     'undefined' !== typeof document
  && 'undefined' !== typeof navigator
) {
  //
  // Hack 2: If you press ESC in FireFox it will close all active connections.
  // Normally this makes sense, when your page is still loading. But versions
  // before FireFox 22 will close all connections including WebSocket connections
  // after page load. One way to prevent this is to do a `preventDefault()` and
  // cancel the operation before it bubbles up to the browsers default handler.
  // It needs to be added as `keydown` event, if it's added keyup it will not be
  // able to prevent the connection from being closed.
  //
  if (document.addEventListener) {
    document.addEventListener('keydown', function keydown(e) {
      if (e.keyCode !== 27 || !e.preventDefault) return;

      e.preventDefault();
    }, false);
  }

  //
  // Hack 3: This is a Mac/Apple bug only, when you're behind a reverse proxy or
  // have you network settings set to `automatic proxy discovery` the safari
  // browser will crash when the WebSocket constructor is initialised. There is
  // no way to detect the usage of these proxies available in JavaScript so we
  // need to do some nasty browser sniffing. This only affects Safari versions
  // lower then 5.1.4
  //
  var ua = (navigator.userAgent || '').toLowerCase()
    , parsed = ua.match(/.+(?:rv|it|ra|ie)[\/: ](\d+)\.(\d+)(?:\.(\d+))?/) || []
    , version = +[parsed[1], parsed[2]].join('.');

  if (
       !~ua.indexOf('chrome')
    && ~ua.indexOf('safari')
    && version < 534.54
  ) {
    Primus.prototype.AVOID_WEBSOCKETS = true;
  }
}

//
// Expose the library.
//
module.exports = Primus;

},{"demolish":1,"emits":2,"eventemitter3":3,"inherits":4,"querystringify":7,"recovery":8,"tick-tock":11,"url-parse":12,"yeast":14}]},{},[15])(15);
var msgpack = (function () {
  var exports, mp;

  try { mp = Primus.requires('primus-msgpack'); }
  catch (e) {}

  if (mp) return mp;

  exports = {};
  exports["msgpack"] =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	exports.encode = __webpack_require__(1).encode;
	exports.decode = __webpack_require__(11).decode;


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	// encode.js

	exports.encode = encode;

	var EncodeBuffer = __webpack_require__(2).EncodeBuffer;

	function encode(input, options) {
	  var encoder = new EncodeBuffer(options);
	  encoder.write(input);
	  return encoder.read();
	}


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {// encode-buffer.js

	exports.EncodeBuffer = EncodeBuffer;

	var preset = __webpack_require__(7).codec.preset;

	var MIN_BUFFER_SIZE = 2048;
	var MAX_BUFFER_SIZE = 65536;

	function EncodeBuffer(options) {
	  if (!(this instanceof EncodeBuffer)) return new EncodeBuffer(options);

	  if (options) {
	    this.options = options;
	    if (options.codec) {
	      this.codec = options.codec;
	    }
	  }
	}

	EncodeBuffer.prototype.offset = 0;
	EncodeBuffer.prototype.start = 0;

	EncodeBuffer.prototype.push = function(chunk) {
	  var buffers = this.buffers || (this.buffers = []);
	  buffers.push(chunk);
	};

	EncodeBuffer.prototype.codec = preset;

	EncodeBuffer.prototype.write = function(input) {
	  this.codec.encode(this, input);
	};

	EncodeBuffer.prototype.read = function() {
	  var length = this.buffers && this.buffers.length;

	  // fetch the first result
	  if (!length) return this.fetch();

	  // flush current buffer
	  this.flush();

	  // read from the results
	  return this.pull();
	};

	EncodeBuffer.prototype.pull = function() {
	  var buffers = this.buffers || (this.buffers = []);
	  var chunk = buffers.length > 1 ? Buffer.concat(buffers) : buffers[0];
	  buffers.length = 0; // buffer exhausted
	  return chunk;
	};

	EncodeBuffer.prototype.fetch = function() {
	  var start = this.start;
	  if (start < this.offset) {
	    this.start = this.offset;
	    return this.buffer.slice(start, this.offset);
	  }
	};

	EncodeBuffer.prototype.flush = function() {
	  var buffer = this.fetch();
	  if (buffer) this.push(buffer);
	};

	EncodeBuffer.prototype.reserve = function(length) {
	  if (this.buffer) {
	    var size = this.buffer.length;

	    // is it long enough?
	    if (this.offset + length < size) return;

	    // flush current buffer
	    this.flush();

	    // resize it to 2x current length
	    length = Math.max(length, Math.min(size * 2, MAX_BUFFER_SIZE));
	  }

	  // minimum buffer size
	  length = length > MIN_BUFFER_SIZE ? length : MIN_BUFFER_SIZE;

	  // allocate new buffer
	  this.buffer = new Buffer(length);
	  this.start = 0;
	  this.offset = 0;
	};

	EncodeBuffer.prototype.send = function(buffer) {
	  var end = this.offset + buffer.length;
	  if (this.buffer && end < this.buffer.length) {
	    buffer.copy(this.buffer, this.offset);
	    this.offset = end;
	  } else {
	    this.flush();
	    this.push(buffer);
	  }
	};

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).Buffer))

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer, global) {/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	/* eslint-disable no-proto */

	'use strict'

	var base64 = __webpack_require__(4)
	var ieee754 = __webpack_require__(5)
	var isArray = __webpack_require__(6)

	exports.Buffer = Buffer
	exports.SlowBuffer = SlowBuffer
	exports.INSPECT_MAX_BYTES = 50
	Buffer.poolSize = 8192 // not used by this implementation

	var rootParent = {}

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
	 *     on objects.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.

	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
	  ? global.TYPED_ARRAY_SUPPORT
	  : typedArraySupport()

	function typedArraySupport () {
	  function Bar () {}
	  try {
	    var arr = new Uint8Array(1)
	    arr.foo = function () { return 42 }
	    arr.constructor = Bar
	    return arr.foo() === 42 && // typed array instances can be augmented
	        arr.constructor === Bar && // constructor can be set
	        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
	        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
	  } catch (e) {
	    return false
	  }
	}

	function kMaxLength () {
	  return Buffer.TYPED_ARRAY_SUPPORT
	    ? 0x7fffffff
	    : 0x3fffffff
	}

	/**
	 * Class: Buffer
	 * =============
	 *
	 * The Buffer constructor returns instances of `Uint8Array` that are augmented
	 * with function properties for all the node `Buffer` API functions. We use
	 * `Uint8Array` so that square bracket notation works as expected -- it returns
	 * a single octet.
	 *
	 * By augmenting the instances, we can avoid modifying the `Uint8Array`
	 * prototype.
	 */
	function Buffer (arg) {
	  if (!(this instanceof Buffer)) {
	    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
	    if (arguments.length > 1) return new Buffer(arg, arguments[1])
	    return new Buffer(arg)
	  }

	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    this.length = 0
	    this.parent = undefined
	  }

	  // Common case.
	  if (typeof arg === 'number') {
	    return fromNumber(this, arg)
	  }

	  // Slightly less common case.
	  if (typeof arg === 'string') {
	    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
	  }

	  // Unusual.
	  return fromObject(this, arg)
	}

	function fromNumber (that, length) {
	  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < length; i++) {
	      that[i] = 0
	    }
	  }
	  return that
	}

	function fromString (that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

	  // Assumption: byteLength() return value is always < kMaxLength.
	  var length = byteLength(string, encoding) | 0
	  that = allocate(that, length)

	  that.write(string, encoding)
	  return that
	}

	function fromObject (that, object) {
	  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

	  if (isArray(object)) return fromArray(that, object)

	  if (object == null) {
	    throw new TypeError('must start with number, buffer, array or string')
	  }

	  if (typeof ArrayBuffer !== 'undefined') {
	    if (object.buffer instanceof ArrayBuffer) {
	      return fromTypedArray(that, object)
	    }
	    if (object instanceof ArrayBuffer) {
	      return fromArrayBuffer(that, object)
	    }
	  }

	  if (object.length) return fromArrayLike(that, object)

	  return fromJsonObject(that, object)
	}

	function fromBuffer (that, buffer) {
	  var length = checked(buffer.length) | 0
	  that = allocate(that, length)
	  buffer.copy(that, 0, 0, length)
	  return that
	}

	function fromArray (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	// Duplicate of fromArray() to keep fromArray() monomorphic.
	function fromTypedArray (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  // Truncating the elements is probably not what people expect from typed
	  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
	  // of the old Buffer constructor.
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	function fromArrayBuffer (that, array) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    array.byteLength
	    that = Buffer._augment(new Uint8Array(array))
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromTypedArray(that, new Uint8Array(array))
	  }
	  return that
	}

	function fromArrayLike (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
	// Returns a zero-length buffer for inputs that don't conform to the spec.
	function fromJsonObject (that, object) {
	  var array
	  var length = 0

	  if (object.type === 'Buffer' && isArray(object.data)) {
	    array = object.data
	    length = checked(array.length) | 0
	  }
	  that = allocate(that, length)

	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	if (Buffer.TYPED_ARRAY_SUPPORT) {
	  Buffer.prototype.__proto__ = Uint8Array.prototype
	  Buffer.__proto__ = Uint8Array
	} else {
	  // pre-set for values that may exist in the future
	  Buffer.prototype.length = undefined
	  Buffer.prototype.parent = undefined
	}

	function allocate (that, length) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = Buffer._augment(new Uint8Array(length))
	    that.__proto__ = Buffer.prototype
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that.length = length
	    that._isBuffer = true
	  }

	  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
	  if (fromPool) that.parent = rootParent

	  return that
	}

	function checked (length) {
	  // Note: cannot use `length < kMaxLength` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
	  }
	  return length | 0
	}

	function SlowBuffer (subject, encoding) {
	  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

	  var buf = new Buffer(subject, encoding)
	  delete buf.parent
	  return buf
	}

	Buffer.isBuffer = function isBuffer (b) {
	  return !!(b != null && b._isBuffer)
	}

	Buffer.compare = function compare (a, b) {
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers')
	  }

	  if (a === b) return 0

	  var x = a.length
	  var y = b.length

	  var i = 0
	  var len = Math.min(x, y)
	  while (i < len) {
	    if (a[i] !== b[i]) break

	    ++i
	  }

	  if (i !== len) {
	    x = a[i]
	    y = b[i]
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}

	Buffer.isEncoding = function isEncoding (encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'binary':
	    case 'base64':
	    case 'raw':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true
	    default:
	      return false
	  }
	}

	Buffer.concat = function concat (list, length) {
	  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

	  if (list.length === 0) {
	    return new Buffer(0)
	  }

	  var i
	  if (length === undefined) {
	    length = 0
	    for (i = 0; i < list.length; i++) {
	      length += list[i].length
	    }
	  }

	  var buf = new Buffer(length)
	  var pos = 0
	  for (i = 0; i < list.length; i++) {
	    var item = list[i]
	    item.copy(buf, pos)
	    pos += item.length
	  }
	  return buf
	}

	function byteLength (string, encoding) {
	  if (typeof string !== 'string') string = '' + string

	  var len = string.length
	  if (len === 0) return 0

	  // Use a for loop to avoid recursion
	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'binary':
	      // Deprecated
	      case 'raw':
	      case 'raws':
	        return len
	      case 'utf8':
	      case 'utf-8':
	        return utf8ToBytes(string).length
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2
	      case 'hex':
	        return len >>> 1
	      case 'base64':
	        return base64ToBytes(string).length
	      default:
	        if (loweredCase) return utf8ToBytes(string).length // assume utf8
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	Buffer.byteLength = byteLength

	function slowToString (encoding, start, end) {
	  var loweredCase = false

	  start = start | 0
	  end = end === undefined || end === Infinity ? this.length : end | 0

	  if (!encoding) encoding = 'utf8'
	  if (start < 0) start = 0
	  if (end > this.length) end = this.length
	  if (end <= start) return ''

	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end)

	      case 'ascii':
	        return asciiSlice(this, start, end)

	      case 'binary':
	        return binarySlice(this, start, end)

	      case 'base64':
	        return base64Slice(this, start, end)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.toString = function toString () {
	  var length = this.length | 0
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	}

	Buffer.prototype.equals = function equals (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer.compare(this, b) === 0
	}

	Buffer.prototype.inspect = function inspect () {
	  var str = ''
	  var max = exports.INSPECT_MAX_BYTES
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
	    if (this.length > max) str += ' ... '
	  }
	  return '<Buffer ' + str + '>'
	}

	Buffer.prototype.compare = function compare (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return 0
	  return Buffer.compare(this, b)
	}

	Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
	  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
	  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
	  byteOffset >>= 0

	  if (this.length === 0) return -1
	  if (byteOffset >= this.length) return -1

	  // Negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

	  if (typeof val === 'string') {
	    if (val.length === 0) return -1 // special case: looking for empty string always fails
	    return String.prototype.indexOf.call(this, val, byteOffset)
	  }
	  if (Buffer.isBuffer(val)) {
	    return arrayIndexOf(this, val, byteOffset)
	  }
	  if (typeof val === 'number') {
	    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
	      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
	    }
	    return arrayIndexOf(this, [ val ], byteOffset)
	  }

	  function arrayIndexOf (arr, val, byteOffset) {
	    var foundIndex = -1
	    for (var i = 0; byteOffset + i < arr.length; i++) {
	      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
	        if (foundIndex === -1) foundIndex = i
	        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
	      } else {
	        foundIndex = -1
	      }
	    }
	    return -1
	  }

	  throw new TypeError('val must be string, number or Buffer')
	}

	// `get` is deprecated
	Buffer.prototype.get = function get (offset) {
	  console.log('.get() is deprecated. Access using array indexes instead.')
	  return this.readUInt8(offset)
	}

	// `set` is deprecated
	Buffer.prototype.set = function set (v, offset) {
	  console.log('.set() is deprecated. Access using array indexes instead.')
	  return this.writeUInt8(v, offset)
	}

	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0
	  var remaining = buf.length - offset
	  if (!length) {
	    length = remaining
	  } else {
	    length = Number(length)
	    if (length > remaining) {
	      length = remaining
	    }
	  }

	  // must be an even number of digits
	  var strLen = string.length
	  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

	  if (length > strLen / 2) {
	    length = strLen / 2
	  }
	  for (var i = 0; i < length; i++) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16)
	    if (isNaN(parsed)) throw new Error('Invalid hex string')
	    buf[offset + i] = parsed
	  }
	  return i
	}

	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}

	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}

	function binaryWrite (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}

	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}

	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}

	Buffer.prototype.write = function write (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8'
	    length = this.length
	    offset = 0
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset
	    length = this.length
	    offset = 0
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
	    offset = offset | 0
	    if (isFinite(length)) {
	      length = length | 0
	      if (encoding === undefined) encoding = 'utf8'
	    } else {
	      encoding = length
	      length = undefined
	    }
	  // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    var swap = encoding
	    encoding = offset
	    offset = length | 0
	    length = swap
	  }

	  var remaining = this.length - offset
	  if (length === undefined || length > remaining) length = remaining

	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
	    throw new RangeError('attempt to write outside buffer bounds')
	  }

	  if (!encoding) encoding = 'utf8'

	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length)

	      case 'ascii':
	        return asciiWrite(this, string, offset, length)

	      case 'binary':
	        return binaryWrite(this, string, offset, length)

	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.toJSON = function toJSON () {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	}

	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return base64.fromByteArray(buf)
	  } else {
	    return base64.fromByteArray(buf.slice(start, end))
	  }
	}

	function utf8Slice (buf, start, end) {
	  end = Math.min(buf.length, end)
	  var res = []

	  var i = start
	  while (i < end) {
	    var firstByte = buf[i]
	    var codePoint = null
	    var bytesPerSequence = (firstByte > 0xEF) ? 4
	      : (firstByte > 0xDF) ? 3
	      : (firstByte > 0xBF) ? 2
	      : 1

	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint

	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte
	          }
	          break
	        case 2:
	          secondByte = buf[i + 1]
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 3:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 4:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          fourthByte = buf[i + 3]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint
	            }
	          }
	      }
	    }

	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD
	      bytesPerSequence = 1
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
	      codePoint = 0xDC00 | codePoint & 0x3FF
	    }

	    res.push(codePoint)
	    i += bytesPerSequence
	  }

	  return decodeCodePointsArray(res)
	}

	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000

	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }

	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = ''
	  var i = 0
	  while (i < len) {
	    res += String.fromCharCode.apply(
	      String,
	      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
	    )
	  }
	  return res
	}

	function asciiSlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i] & 0x7F)
	  }
	  return ret
	}

	function binarySlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i])
	  }
	  return ret
	}

	function hexSlice (buf, start, end) {
	  var len = buf.length

	  if (!start || start < 0) start = 0
	  if (!end || end < 0 || end > len) end = len

	  var out = ''
	  for (var i = start; i < end; i++) {
	    out += toHex(buf[i])
	  }
	  return out
	}

	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end)
	  var res = ''
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
	  }
	  return res
	}

	Buffer.prototype.slice = function slice (start, end) {
	  var len = this.length
	  start = ~~start
	  end = end === undefined ? len : ~~end

	  if (start < 0) {
	    start += len
	    if (start < 0) start = 0
	  } else if (start > len) {
	    start = len
	  }

	  if (end < 0) {
	    end += len
	    if (end < 0) end = 0
	  } else if (end > len) {
	    end = len
	  }

	  if (end < start) end = start

	  var newBuf
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    newBuf = Buffer._augment(this.subarray(start, end))
	  } else {
	    var sliceLen = end - start
	    newBuf = new Buffer(sliceLen, undefined)
	    for (var i = 0; i < sliceLen; i++) {
	      newBuf[i] = this[i + start]
	    }
	  }

	  if (newBuf.length) newBuf.parent = this.parent || this

	  return newBuf
	}

	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}

	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }

	  return val
	}

	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length)
	  }

	  var val = this[offset + --byteLength]
	  var mul = 1
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul
	  }

	  return val
	}

	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  return this[offset]
	}

	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return this[offset] | (this[offset + 1] << 8)
	}

	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return (this[offset] << 8) | this[offset + 1]
	}

	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	}

	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] * 0x1000000) +
	    ((this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    this[offset + 3])
	}

	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var i = byteLength
	  var mul = 1
	  var val = this[offset + --i]
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	}

	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset] | (this[offset + 1] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset + 1] | (this[offset] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset]) |
	    (this[offset + 1] << 8) |
	    (this[offset + 2] << 16) |
	    (this[offset + 3] << 24)
	}

	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] << 24) |
	    (this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    (this[offset + 3])
	}

	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, true, 23, 4)
	}

	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, false, 23, 4)
	}

	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, true, 52, 8)
	}

	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, false, 52, 8)
	}

	function checkInt (buf, value, offset, ext, max, min) {
	  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('index out of range')
	}

	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

	  var mul = 1
	  var i = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

	  var i = byteLength - 1
	  var mul = 1
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	function objectWriteUInt16 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
	    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
	      (littleEndian ? i : 1 - i) * 8
	  }
	}

	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	function objectWriteUInt32 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
	    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
	  }
	}

	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 1] = (value >>> 8)
	    this[offset] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = 0
	  var mul = 1
	  var sub = value < 0 ? 1 : 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = byteLength - 1
	  var mul = 1
	  var sub = value < 0 ? 1 : 0
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  if (value < 0) value = 0xff + value + 1
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 3] = (value >>> 24)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (value < 0) value = 0xffffffff + value + 1
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (value > max || value < min) throw new RangeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('index out of range')
	  if (offset < 0) throw new RangeError('index out of range')
	}

	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 23, 4)
	  return offset + 4
	}

	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	}

	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 52, 8)
	  return offset + 8
	}

	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	}

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!start) start = 0
	  if (!end && end !== 0) end = this.length
	  if (targetStart >= target.length) targetStart = target.length
	  if (!targetStart) targetStart = 0
	  if (end > 0 && end < start) end = start

	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0

	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')

	  // Are we oob?
	  if (end > this.length) end = this.length
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start
	  }

	  var len = end - start
	  var i

	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; i--) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; i++) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else {
	    target._set(this.subarray(start, start + len), targetStart)
	  }

	  return len
	}

	// fill(value, start=0, end=buffer.length)
	Buffer.prototype.fill = function fill (value, start, end) {
	  if (!value) value = 0
	  if (!start) start = 0
	  if (!end) end = this.length

	  if (end < start) throw new RangeError('end < start')

	  // Fill 0 bytes; we're done
	  if (end === start) return
	  if (this.length === 0) return

	  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
	  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

	  var i
	  if (typeof value === 'number') {
	    for (i = start; i < end; i++) {
	      this[i] = value
	    }
	  } else {
	    var bytes = utf8ToBytes(value.toString())
	    var len = bytes.length
	    for (i = start; i < end; i++) {
	      this[i] = bytes[i % len]
	    }
	  }

	  return this
	}

	/**
	 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
	 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
	 */
	Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
	  if (typeof Uint8Array !== 'undefined') {
	    if (Buffer.TYPED_ARRAY_SUPPORT) {
	      return (new Buffer(this)).buffer
	    } else {
	      var buf = new Uint8Array(this.length)
	      for (var i = 0, len = buf.length; i < len; i += 1) {
	        buf[i] = this[i]
	      }
	      return buf.buffer
	    }
	  } else {
	    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
	  }
	}

	// HELPER FUNCTIONS
	// ================

	var BP = Buffer.prototype

	/**
	 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
	 */
	Buffer._augment = function _augment (arr) {
	  arr.constructor = Buffer
	  arr._isBuffer = true

	  // save reference to original Uint8Array set method before overwriting
	  arr._set = arr.set

	  // deprecated
	  arr.get = BP.get
	  arr.set = BP.set

	  arr.write = BP.write
	  arr.toString = BP.toString
	  arr.toLocaleString = BP.toString
	  arr.toJSON = BP.toJSON
	  arr.equals = BP.equals
	  arr.compare = BP.compare
	  arr.indexOf = BP.indexOf
	  arr.copy = BP.copy
	  arr.slice = BP.slice
	  arr.readUIntLE = BP.readUIntLE
	  arr.readUIntBE = BP.readUIntBE
	  arr.readUInt8 = BP.readUInt8
	  arr.readUInt16LE = BP.readUInt16LE
	  arr.readUInt16BE = BP.readUInt16BE
	  arr.readUInt32LE = BP.readUInt32LE
	  arr.readUInt32BE = BP.readUInt32BE
	  arr.readIntLE = BP.readIntLE
	  arr.readIntBE = BP.readIntBE
	  arr.readInt8 = BP.readInt8
	  arr.readInt16LE = BP.readInt16LE
	  arr.readInt16BE = BP.readInt16BE
	  arr.readInt32LE = BP.readInt32LE
	  arr.readInt32BE = BP.readInt32BE
	  arr.readFloatLE = BP.readFloatLE
	  arr.readFloatBE = BP.readFloatBE
	  arr.readDoubleLE = BP.readDoubleLE
	  arr.readDoubleBE = BP.readDoubleBE
	  arr.writeUInt8 = BP.writeUInt8
	  arr.writeUIntLE = BP.writeUIntLE
	  arr.writeUIntBE = BP.writeUIntBE
	  arr.writeUInt16LE = BP.writeUInt16LE
	  arr.writeUInt16BE = BP.writeUInt16BE
	  arr.writeUInt32LE = BP.writeUInt32LE
	  arr.writeUInt32BE = BP.writeUInt32BE
	  arr.writeIntLE = BP.writeIntLE
	  arr.writeIntBE = BP.writeIntBE
	  arr.writeInt8 = BP.writeInt8
	  arr.writeInt16LE = BP.writeInt16LE
	  arr.writeInt16BE = BP.writeInt16BE
	  arr.writeInt32LE = BP.writeInt32LE
	  arr.writeInt32BE = BP.writeInt32BE
	  arr.writeFloatLE = BP.writeFloatLE
	  arr.writeFloatBE = BP.writeFloatBE
	  arr.writeDoubleLE = BP.writeDoubleLE
	  arr.writeDoubleBE = BP.writeDoubleBE
	  arr.fill = BP.fill
	  arr.inspect = BP.inspect
	  arr.toArrayBuffer = BP.toArrayBuffer

	  return arr
	}

	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '='
	  }
	  return str
	}

	function stringtrim (str) {
	  if (str.trim) return str.trim()
	  return str.replace(/^\s+|\s+$/g, '')
	}

	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}

	function utf8ToBytes (string, units) {
	  units = units || Infinity
	  var codePoint
	  var length = string.length
	  var leadSurrogate = null
	  var bytes = []

	  for (var i = 0; i < length; i++) {
	    codePoint = string.charCodeAt(i)

	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        }

	        // valid lead
	        leadSurrogate = codePoint

	        continue
	      }

	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	        leadSurrogate = codePoint
	        continue
	      }

	      // valid surrogate pair
	      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	    }

	    leadSurrogate = null

	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break
	      bytes.push(codePoint)
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break
	      bytes.push(
	        codePoint >> 0x6 | 0xC0,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break
	      bytes.push(
	        codePoint >> 0xC | 0xE0,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break
	      bytes.push(
	        codePoint >> 0x12 | 0xF0,
	        codePoint >> 0xC & 0x3F | 0x80,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else {
	      throw new Error('Invalid code point')
	    }
	  }

	  return bytes
	}

	function asciiToBytes (str) {
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF)
	  }
	  return byteArray
	}

	function utf16leToBytes (str, units) {
	  var c, hi, lo
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    if ((units -= 2) < 0) break

	    c = str.charCodeAt(i)
	    hi = c >> 8
	    lo = c % 256
	    byteArray.push(lo)
	    byteArray.push(hi)
	  }

	  return byteArray
	}

	function base64ToBytes (str) {
	  return base64.toByteArray(base64clean(str))
	}

	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; i++) {
	    if ((i + offset >= dst.length) || (i >= src.length)) break
	    dst[i + offset] = src[i]
	  }
	  return i
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).Buffer, (function() { return this; }())))

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	;(function (exports) {
		'use strict';

	  var Arr = (typeof Uint8Array !== 'undefined')
	    ? Uint8Array
	    : Array

		var PLUS   = '+'.charCodeAt(0)
		var SLASH  = '/'.charCodeAt(0)
		var NUMBER = '0'.charCodeAt(0)
		var LOWER  = 'a'.charCodeAt(0)
		var UPPER  = 'A'.charCodeAt(0)
		var PLUS_URL_SAFE = '-'.charCodeAt(0)
		var SLASH_URL_SAFE = '_'.charCodeAt(0)

		function decode (elt) {
			var code = elt.charCodeAt(0)
			if (code === PLUS ||
			    code === PLUS_URL_SAFE)
				return 62 // '+'
			if (code === SLASH ||
			    code === SLASH_URL_SAFE)
				return 63 // '/'
			if (code < NUMBER)
				return -1 //no match
			if (code < NUMBER + 10)
				return code - NUMBER + 26 + 26
			if (code < UPPER + 26)
				return code - UPPER
			if (code < LOWER + 26)
				return code - LOWER + 26
		}

		function b64ToByteArray (b64) {
			var i, j, l, tmp, placeHolders, arr

			if (b64.length % 4 > 0) {
				throw new Error('Invalid string. Length must be a multiple of 4')
			}

			// the number of equal signs (place holders)
			// if there are two placeholders, than the two characters before it
			// represent one byte
			// if there is only one, then the three characters before it represent 2 bytes
			// this is just a cheap hack to not do indexOf twice
			var len = b64.length
			placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

			// base64 is 4/3 + up to two characters of the original data
			arr = new Arr(b64.length * 3 / 4 - placeHolders)

			// if there are placeholders, only get up to the last complete 4 chars
			l = placeHolders > 0 ? b64.length - 4 : b64.length

			var L = 0

			function push (v) {
				arr[L++] = v
			}

			for (i = 0, j = 0; i < l; i += 4, j += 3) {
				tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
				push((tmp & 0xFF0000) >> 16)
				push((tmp & 0xFF00) >> 8)
				push(tmp & 0xFF)
			}

			if (placeHolders === 2) {
				tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
				push(tmp & 0xFF)
			} else if (placeHolders === 1) {
				tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
				push((tmp >> 8) & 0xFF)
				push(tmp & 0xFF)
			}

			return arr
		}

		function uint8ToBase64 (uint8) {
			var i,
				extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
				output = "",
				temp, length

			function encode (num) {
				return lookup.charAt(num)
			}

			function tripletToBase64 (num) {
				return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
			}

			// go through the array every three bytes, we'll deal with trailing stuff later
			for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
				temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
				output += tripletToBase64(temp)
			}

			// pad the end with zeros, but make sure to not forget the extra bytes
			switch (extraBytes) {
				case 1:
					temp = uint8[uint8.length - 1]
					output += encode(temp >> 2)
					output += encode((temp << 4) & 0x3F)
					output += '=='
					break
				case 2:
					temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
					output += encode(temp >> 10)
					output += encode((temp >> 4) & 0x3F)
					output += encode((temp << 2) & 0x3F)
					output += '='
					break
			}

			return output
		}

		exports.toByteArray = b64ToByteArray
		exports.fromByteArray = uint8ToBase64
	}( false ? (this.base64js = {}) : exports))


/***/ },
/* 5 */
/***/ function(module, exports) {

	exports.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var nBits = -7
	  var i = isLE ? (nBytes - 1) : 0
	  var d = isLE ? -1 : 1
	  var s = buffer[offset + i]

	  i += d

	  e = s & ((1 << (-nBits)) - 1)
	  s >>= (-nBits)
	  nBits += eLen
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1)
	  e >>= (-nBits)
	  nBits += mLen
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen)
	    e = e - eBias
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}

	exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
	  var i = isLE ? 0 : (nBytes - 1)
	  var d = isLE ? 1 : -1
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

	  value = Math.abs(value)

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0
	    e = eMax
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2)
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--
	      c *= 2
	    }
	    if (e + eBias >= 1) {
	      value += rt / c
	    } else {
	      value += rt * Math.pow(2, 1 - eBias)
	    }
	    if (value * c >= 2) {
	      e++
	      c /= 2
	    }

	    if (e + eBias >= eMax) {
	      m = 0
	      e = eMax
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen)
	      e = e + eBias
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
	      e = 0
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m
	  eLen += mLen
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128
	}


/***/ },
/* 6 */
/***/ function(module, exports) {

	var toString = {}.toString;

	module.exports = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	// codec.js

	exports.codec = {
	  preset: __webpack_require__(8).createCodec({preset: true})
	};


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	// ext.js

	var IS_ARRAY = __webpack_require__(6);

	exports.createCodec = createCodec;

	var ExtBuffer = __webpack_require__(9).ExtBuffer;
	var ExtPreset = __webpack_require__(10);
	var ReadCore = __webpack_require__(14);
	var WriteCore = __webpack_require__(19);

	function Codec(options) {
	  if (!(this instanceof Codec)) return new Codec(options);
	  this.extPackers = {};
	  this.extUnpackers = [];
	  this.encode = WriteCore.getEncoder(options);
	  this.decode = ReadCore.getDecoder(options);
	  if (options && options.preset) {
	    ExtPreset.setExtPreset(this);
	  }
	}

	function createCodec(options) {
	  return new Codec(options);
	}

	Codec.prototype.addExtPacker = function(etype, Class, packer) {
	  if (IS_ARRAY(packer)) {
	    packer = join(packer);
	  }
	  var name = Class.name;
	  if (name && name !== "Object") {
	    this.extPackers[name] = extPacker;
	  } else {
	    var list = this.extEncoderList || (this.extEncoderList = []);
	    list.unshift([Class, extPacker]);
	  }

	  function extPacker(value) {
	    var buffer = packer(value);
	    return new ExtBuffer(buffer, etype);
	  }
	};

	Codec.prototype.addExtUnpacker = function(etype, unpacker) {
	  this.extUnpackers[etype] = IS_ARRAY(unpacker) ? join(unpacker) : unpacker;
	};

	Codec.prototype.getExtPacker = function(value) {
	  var c = value.constructor;
	  var e = c && c.name && this.extPackers[c.name];
	  if (e) return e;
	  var list = this.extEncoderList;
	  if (!list) return;
	  var len = list.length;
	  for (var i = 0; i < len; i++) {
	    var pair = list[i];
	    if (c === pair[0]) return pair[1];
	  }
	};

	Codec.prototype.getExtUnpacker = function(type) {
	  return this.extUnpackers[type] || extUnpacker;

	  function extUnpacker(buffer) {
	    return new ExtBuffer(buffer, type);
	  }
	};

	function join(filters) {
	  filters = filters.slice();

	  return function(value) {
	    return filters.reduce(iterator, value);
	  };

	  function iterator(value, filter) {
	    return filter(value);
	  }
	}


/***/ },
/* 9 */
/***/ function(module, exports) {

	// ext-buffer.js

	exports.ExtBuffer = ExtBuffer;

	function ExtBuffer(buffer, type) {
	  if (!(this instanceof ExtBuffer)) return new ExtBuffer(buffer, type);
	  this.buffer = buffer;
	  this.type = type;
	}


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {// ext-preset.js

	exports.setExtPreset = setExtPreset;

	var _encode, _decode;
	var hasUint8Array = ("undefined" !== typeof Uint8Array);
	var hasFloat64Array = ("undefined" !== typeof Float64Array);
	var hasUint8ClampedArray = ("undefined" !== typeof Uint8ClampedArray);

	var ERROR_COLUMNS = {name: 1, message: 1, stack: 1, columnNumber: 1, fileName: 1, lineNumber: 1};

	function setExtPreset(codec) {
	  setExtPackers(codec);
	  setExtUnpackers(codec);
	}

	function setExtPackers(preset) {
	  preset.addExtPacker(0x0E, Error, [packError, encode]);
	  preset.addExtPacker(0x01, EvalError, [packError, encode]);
	  preset.addExtPacker(0x02, RangeError, [packError, encode]);
	  preset.addExtPacker(0x03, ReferenceError, [packError, encode]);
	  preset.addExtPacker(0x04, SyntaxError, [packError, encode]);
	  preset.addExtPacker(0x05, TypeError, [packError, encode]);
	  preset.addExtPacker(0x06, URIError, [packError, encode]);

	  preset.addExtPacker(0x0A, RegExp, [packRegExp, encode]);
	  preset.addExtPacker(0x0B, Boolean, [packValueOf, encode]);
	  preset.addExtPacker(0x0C, String, [packValueOf, encode]);
	  preset.addExtPacker(0x0D, Date, [Number, encode]);
	  preset.addExtPacker(0x0F, Number, [packValueOf, encode]);

	  if (hasUint8Array) {
	    preset.addExtPacker(0x11, Int8Array, packBuffer);
	    preset.addExtPacker(0x12, Uint8Array, packBuffer);
	    preset.addExtPacker(0x13, Int16Array, packTypedArray);
	    preset.addExtPacker(0x14, Uint16Array, packTypedArray);
	    preset.addExtPacker(0x15, Int32Array, packTypedArray);
	    preset.addExtPacker(0x16, Uint32Array, packTypedArray);
	    preset.addExtPacker(0x17, Float32Array, packTypedArray);

	    if (hasFloat64Array) {
	      // PhantomJS/1.9.7 doesn't have Float64Array
	      preset.addExtPacker(0x18, Float64Array, packTypedArray);
	    }

	    if (hasUint8ClampedArray) {
	      // IE10 doesn't have Uint8ClampedArray
	      preset.addExtPacker(0x19, Uint8ClampedArray, packBuffer);
	      preset.addExtUnpacker(0x19, unpackClass(Uint8ClampedArray));
	    }

	    preset.addExtPacker(0x1A, ArrayBuffer, packArrayBuffer);
	    preset.addExtPacker(0x1D, DataView, packTypedArray);
	    preset.addExtUnpacker(0x1A, unpackArrayBuffer);
	    preset.addExtUnpacker(0x1D, [unpackArrayBuffer, unpackClass(DataView)]);
	  }
	}

	function setExtUnpackers(preset) {
	  preset.addExtPacker(0x0E, Error, [packError, encode]);
	  preset.addExtPacker(0x01, EvalError, [packError, encode]);
	  preset.addExtPacker(0x02, RangeError, [packError, encode]);
	  preset.addExtPacker(0x03, ReferenceError, [packError, encode]);
	  preset.addExtPacker(0x04, SyntaxError, [packError, encode]);
	  preset.addExtPacker(0x05, TypeError, [packError, encode]);
	  preset.addExtPacker(0x06, URIError, [packError, encode]);

	  preset.addExtUnpacker(0x0E, [decode, unpackError(Error)]);
	  preset.addExtUnpacker(0x01, [decode, unpackError(EvalError)]);
	  preset.addExtUnpacker(0x02, [decode, unpackError(RangeError)]);
	  preset.addExtUnpacker(0x03, [decode, unpackError(ReferenceError)]);
	  preset.addExtUnpacker(0x04, [decode, unpackError(SyntaxError)]);
	  preset.addExtUnpacker(0x05, [decode, unpackError(TypeError)]);
	  preset.addExtUnpacker(0x06, [decode, unpackError(URIError)]);

	  preset.addExtPacker(0x0A, RegExp, [packRegExp, encode]);
	  preset.addExtPacker(0x0B, Boolean, [packValueOf, encode]);
	  preset.addExtPacker(0x0C, String, [packValueOf, encode]);
	  preset.addExtPacker(0x0D, Date, [Number, encode]);
	  preset.addExtPacker(0x0F, Number, [packValueOf, encode]);

	  preset.addExtUnpacker(0x0A, [decode, unpackRegExp]);
	  preset.addExtUnpacker(0x0B, [decode, unpackClass(Boolean)]);
	  preset.addExtUnpacker(0x0C, [decode, unpackClass(String)]);
	  preset.addExtUnpacker(0x0D, [decode, unpackClass(Date)]);
	  preset.addExtUnpacker(0x0F, [decode, unpackClass(Number)]);

	  if (hasUint8Array) {
	    preset.addExtPacker(0x11, Int8Array, packBuffer);
	    preset.addExtPacker(0x12, Uint8Array, packBuffer);
	    preset.addExtPacker(0x13, Int16Array, packTypedArray);
	    preset.addExtPacker(0x14, Uint16Array, packTypedArray);
	    preset.addExtPacker(0x15, Int32Array, packTypedArray);
	    preset.addExtPacker(0x16, Uint32Array, packTypedArray);
	    preset.addExtPacker(0x17, Float32Array, packTypedArray);

	    preset.addExtUnpacker(0x11, unpackClass(Int8Array));
	    preset.addExtUnpacker(0x12, unpackClass(Uint8Array));
	    preset.addExtUnpacker(0x13, [unpackArrayBuffer, unpackClass(Int16Array)]);
	    preset.addExtUnpacker(0x14, [unpackArrayBuffer, unpackClass(Uint16Array)]);
	    preset.addExtUnpacker(0x15, [unpackArrayBuffer, unpackClass(Int32Array)]);
	    preset.addExtUnpacker(0x16, [unpackArrayBuffer, unpackClass(Uint32Array)]);
	    preset.addExtUnpacker(0x17, [unpackArrayBuffer, unpackClass(Float32Array)]);

	    if (hasFloat64Array) {
	      // PhantomJS/1.9.7 doesn't have Float64Array
	      preset.addExtPacker(0x18, Float64Array, packTypedArray);
	      preset.addExtUnpacker(0x18, [unpackArrayBuffer, unpackClass(Float64Array)]);
	    }

	    if (hasUint8ClampedArray) {
	      // IE10 doesn't have Uint8ClampedArray
	      preset.addExtPacker(0x19, Uint8ClampedArray, packBuffer);
	      preset.addExtUnpacker(0x19, unpackClass(Uint8ClampedArray));
	    }

	    preset.addExtPacker(0x1A, ArrayBuffer, packArrayBuffer);
	    preset.addExtPacker(0x1D, DataView, packTypedArray);
	    preset.addExtUnpacker(0x1A, unpackArrayBuffer);
	    preset.addExtUnpacker(0x1D, [unpackArrayBuffer, unpackClass(DataView)]);
	  }
	}

	function encode(input) {
	  if (!_encode) _encode = __webpack_require__(1).encode; // lazy load
	  return _encode(input);
	}

	function decode(input) {
	  if (!_decode) _decode = __webpack_require__(11).decode; // lazy load
	  return _decode(input);
	}

	function packBuffer(value) {
	  return new Buffer(value);
	}

	function packValueOf(value) {
	  return (value).valueOf();
	}

	function packRegExp(value) {
	  value = RegExp.prototype.toString.call(value).split("/");
	  value.shift();
	  var out = [value.pop()];
	  out.unshift(value.join("/"));
	  return out;
	}

	function unpackRegExp(value) {
	  return RegExp.apply(null, value);
	}

	function packError(value) {
	  var out = {};
	  for (var key in ERROR_COLUMNS) {
	    out[key] = value[key];
	  }
	  return out;
	}

	function unpackError(Class) {
	  return function(value) {
	    var out = new Class();
	    for (var key in ERROR_COLUMNS) {
	      out[key] = value[key];
	    }
	    return out;
	  };
	}

	function unpackClass(Class) {
	  return function(value) {
	    return new Class(value);
	  };
	}

	function packTypedArray(value) {
	  return new Buffer(new Uint8Array(value.buffer));
	}

	function packArrayBuffer(value) {
	  return new Buffer(new Uint8Array(value));
	}

	function unpackArrayBuffer(value) {
	  return (new Uint8Array(value)).buffer;
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).Buffer))

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	// decode.js

	exports.decode = decode;

	var DecodeBuffer = __webpack_require__(12).DecodeBuffer;

	function decode(input, options) {
	  var decoder = new DecodeBuffer(options);
	  decoder.write(input);
	  return decoder.read();
	}

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {// decode-buffer.js

	exports.DecodeBuffer = DecodeBuffer;

	var preset = __webpack_require__(7).codec.preset;

	var BufferShortageError = __webpack_require__(13).BufferShortageError;

	function DecodeBuffer(options) {
	  if (!(this instanceof DecodeBuffer)) return new DecodeBuffer(options);

	  if (options) {
	    this.options = options;
	    if (options.codec) {
	      this.codec = options.codec;
	    }
	  }
	}

	DecodeBuffer.prototype.offset = 0;

	DecodeBuffer.prototype.push = function(chunk) {
	  var buffers = this.buffers || (this.buffers = []);
	  buffers.push(chunk);
	};

	DecodeBuffer.prototype.codec = preset;

	DecodeBuffer.prototype.write = function(chunk) {
	  var prev = this.offset ? this.buffer.slice(this.offset) : this.buffer;
	  this.buffer = prev ? (chunk ? Buffer.concat([prev, chunk]) : prev) : chunk;
	  this.offset = 0;
	};

	DecodeBuffer.prototype.read = function() {
	  var length = this.buffers && this.buffers.length;

	  // fetch the first result
	  if (!length) return this.fetch();

	  // flush current buffer
	  this.flush();

	  // read from the results
	  return this.pull();
	};

	DecodeBuffer.prototype.pull = function() {
	  var buffers = this.buffers || (this.buffers = []);
	  return buffers.shift();
	};

	DecodeBuffer.prototype.fetch = function() {
	  return this.codec.decode(this);
	};

	DecodeBuffer.prototype.flush = function() {
	  while (this.offset < this.buffer.length) {
	    var start = this.offset;
	    var value;
	    try {
	      value = this.fetch();
	    } catch (e) {
	      if (!(e instanceof BufferShortageError)) throw e;
	      // rollback
	      this.offset = start;
	      break;
	    }
	    this.push(value);
	  }
	};

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).Buffer))

/***/ },
/* 13 */
/***/ function(module, exports) {

	// buffer-shortage.js

	exports.BufferShortageError = BufferShortageError;

	BufferShortageError.prototype = Error.prototype;

	function BufferShortageError() {
	}


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	// read-core.js

	exports.getDecoder = getDecoder;

	var readUint8 = __webpack_require__(15).readUint8;
	var ReadToken = __webpack_require__(18);

	function getDecoder(options) {
	  var readToken = ReadToken.getReadToken(options);
	  return decode;

	  function decode(decoder) {
	    var type = readUint8(decoder);
	    var func = readToken[type];
	    if (!func) throw new Error("Invalid type: " + (type ? ("0x" + type.toString(16)) : type));
	    return func(decoder);
	  }
	}


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {// read-format.js

	var ieee754 = __webpack_require__(5);
	var Int64Buffer = __webpack_require__(16);
	var Uint64BE = Int64Buffer.Uint64BE;
	var Int64BE = Int64Buffer.Int64BE;

	exports.getReadFormat = getReadFormat;
	exports.readUint8 = uint8;

	var BufferLite = __webpack_require__(17);
	var BufferShortageError = __webpack_require__(13).BufferShortageError;

	var IS_BUFFER_SHIM = ("TYPED_ARRAY_SUPPORT" in Buffer);
	var NO_ASSERT = true;

	function getReadFormat(options) {
	  var readFormat = {
	    map: map,
	    array: array,
	    str: str,
	    bin: bin,
	    ext: ext,
	    uint8: uint8,
	    uint16: uint16,
	    uint32: read(4, Buffer.prototype.readUInt32BE),
	    uint64: read(8, readUInt64BE),
	    int8: read(1, Buffer.prototype.readInt8),
	    int16: read(2, Buffer.prototype.readInt16BE),
	    int32: read(4, Buffer.prototype.readInt32BE),
	    int64: read(8, readInt64BE),
	    float32: read(4, readFloatBE),
	    float64: read(8, readDoubleBE)
	  };

	  if (options && options.int64) {
	    readFormat.uint64 = read(8, readUInt64BE_int64);
	    readFormat.int64 = read(8, readInt64BE_int64);
	  }

	  return readFormat;
	}

	function map(decoder, len) {
	  var value = {};
	  var i;
	  var k = new Array(len);
	  var v = new Array(len);

	  var decode = decoder.codec.decode;
	  for (i = 0; i < len; i++) {
	    k[i] = decode(decoder);
	    v[i] = decode(decoder);
	  }
	  for (i = 0; i < len; i++) {
	    value[k[i]] = v[i];
	  }
	  return value;
	}

	function array(decoder, len) {
	  var value = new Array(len);
	  var decode = decoder.codec.decode;
	  for (var i = 0; i < len; i++) {
	    value[i] = decode(decoder);
	  }
	  return value;
	}

	function str(decoder, len) {
	  var start = decoder.offset;
	  var end = decoder.offset = start + len;
	  var buffer = decoder.buffer;
	  if (end > buffer.length) throw new BufferShortageError();
	  if (IS_BUFFER_SHIM || !Buffer.isBuffer(buffer)) {
	    // slower (compat)
	    return BufferLite.readString.call(buffer, start, end);
	  } else {
	    // 2x faster
	    return buffer.toString("utf-8", start, end);
	  }
	}

	function bin(decoder, len) {
	  var start = decoder.offset;
	  var end = decoder.offset = start + len;
	  if (end > decoder.buffer.length) throw new BufferShortageError();
	  return slice.call(decoder.buffer, start, end);
	}

	function ext(decoder, len) {
	  var start = decoder.offset;
	  var end = decoder.offset = start + len + 1;
	  if (end > decoder.buffer.length) throw new BufferShortageError();
	  var type = decoder.buffer[start];
	  var unpack = decoder.codec.getExtUnpacker(type);
	  if (!unpack) throw new Error("Invalid ext type: " + (type ? ("0x" + type.toString(16)) : type));
	  var buf = slice.call(decoder.buffer, start + 1, end);
	  return unpack(buf);
	}

	function uint8(decoder) {
	  var buffer = decoder.buffer;
	  if (decoder.offset >= buffer.length) throw new BufferShortageError();
	  return buffer[decoder.offset++];
	}

	function uint16(decoder) {
	  var buffer = decoder.buffer;
	  if (decoder.offset + 2 > buffer.length) throw new BufferShortageError();
	  return (buffer[decoder.offset++] << 8) | buffer[decoder.offset++];
	}

	function read(len, method) {
	  return function(decoder) {
	    var start = decoder.offset;
	    var end = decoder.offset = start + len;
	    if (end > decoder.buffer.length) throw new BufferShortageError();
	    return method.call(decoder.buffer, start, NO_ASSERT);
	  };
	}

	function readUInt64BE(start) {
	  return new Uint64BE(this, start).toNumber();
	}

	function readInt64BE(start) {
	  return new Int64BE(this, start).toNumber();
	}

	function readUInt64BE_int64(start) {
	  return new Uint64BE(this, start);
	}

	function readInt64BE_int64(start) {
	  return new Int64BE(this, start);
	}

	function readFloatBE(start) {
	  if (this.readFloatBE) return this.readFloatBE(start);
	  return ieee754.read(this, start, false, 23, 4);
	}

	function readDoubleBE(start) {
	  if (this.readDoubleBE) return this.readDoubleBE(start);
	  return ieee754.read(this, start, false, 52, 8);
	}

	function slice(start, end) {
	  var f = this.slice || Array.prototype.slice;
	  var buf = f.call(this, start, end);
	  if (!Buffer.isBuffer(buf)) buf = Buffer(buf);
	  return buf;
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).Buffer))

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {// int64-buffer.js

	/*jshint -W018 */ // Confusing use of '!'.
	/*jshint -W030 */ // Expected an assignment or function call and instead saw an expression.
	/*jshint -W093 */ // Did you mean to return a conditional instead of an assignment?

	var Uint64BE, Int64BE, Uint64LE, Int64LE;

	!function(exports) {
	  // constants

	  var UNDEFINED = "undefined";
	  var BUFFER = (UNDEFINED !== typeof Buffer) && Buffer;
	  var UINT8ARRAY = (UNDEFINED !== typeof Uint8Array) && Uint8Array;
	  var ARRAYBUFFER = (UNDEFINED !== typeof ArrayBuffer) && ArrayBuffer;
	  var ZERO = [0, 0, 0, 0, 0, 0, 0, 0];
	  var isArray = Array.isArray || _isArray;
	  var BIT32 = 4294967296;
	  var BIT24 = 16777216;

	  // storage class

	  var storage; // Array;

	  // generate classes

	  Uint64BE = factory("Uint64BE", true, true);
	  Int64BE = factory("Int64BE", true, false);
	  Uint64LE = factory("Uint64LE", false, true);
	  Int64LE = factory("Int64LE", false, false);

	  // class factory

	  function factory(name, bigendian, unsigned) {
	    var posH = bigendian ? 0 : 4;
	    var posL = bigendian ? 4 : 0;
	    var pos0 = bigendian ? 0 : 3;
	    var pos1 = bigendian ? 1 : 2;
	    var pos2 = bigendian ? 2 : 1;
	    var pos3 = bigendian ? 3 : 0;
	    var fromPositive = bigendian ? fromPositiveBE : fromPositiveLE;
	    var fromNegative = bigendian ? fromNegativeBE : fromNegativeLE;
	    var proto = Int64.prototype;
	    var isName = "is" + name;
	    var _isInt64 = "_" + isName;

	    // properties
	    proto.buffer = void 0;
	    proto.offset = 0;
	    proto[_isInt64] = true;

	    // methods
	    proto.toNumber = toNumber;
	    proto.toString = toString;
	    proto.toJSON = toNumber;
	    proto.toArray = toArray;

	    // add .toBuffer() method only when Buffer available
	    if (BUFFER) proto.toBuffer = toBuffer;

	    // add .toArrayBuffer() method only when Uint8Array available
	    if (UINT8ARRAY) proto.toArrayBuffer = toArrayBuffer;

	    // isUint64BE, isInt64BE
	    Int64[isName] = isInt64;

	    // CommonJS
	    exports[name] = Int64;

	    return Int64;

	    // constructor
	    function Int64(buffer, offset, value, raddix) {
	      if (!(this instanceof Int64)) return new Int64(buffer, offset, value, raddix);
	      return init(this, buffer, offset, value, raddix);
	    }

	    // isUint64BE, isInt64BE
	    function isInt64(b) {
	      return !!(b && b[_isInt64]);
	    }

	    // initializer
	    function init(that, buffer, offset, value, raddix) {
	      if (UINT8ARRAY && ARRAYBUFFER) {
	        if (buffer instanceof ARRAYBUFFER) buffer = new UINT8ARRAY(buffer);
	        if (value instanceof ARRAYBUFFER) value = new UINT8ARRAY(value);
	      }

	      // Int64BE() style
	      if (!buffer && !offset && !value && !storage) {
	        // shortcut to initialize with zero
	        that.buffer = newArray(ZERO, 0);
	        return;
	      }

	      // Int64BE(value, raddix) style
	      if (!isValidBuffer(buffer, offset)) {
	        var _storage = storage || Array;
	        raddix = offset;
	        value = buffer;
	        offset = 0;
	        buffer = new _storage(8);
	      }

	      that.buffer = buffer;
	      that.offset = offset |= 0;

	      // Int64BE(buffer, offset) style
	      if (UNDEFINED === typeof value) return;

	      // Int64BE(buffer, offset, value, raddix) style
	      if ("string" === typeof value) {
	        fromString(buffer, offset, value, raddix || 10);
	      } else if (isValidBuffer(value, raddix)) {
	        fromArray(buffer, offset, value, raddix);
	      } else if ("number" === typeof raddix) {
	        writeInt32(buffer, offset + posH, value); // high
	        writeInt32(buffer, offset + posL, raddix); // low
	      } else if (value > 0) {
	        fromPositive(buffer, offset, value); // positive
	      } else if (value < 0) {
	        fromNegative(buffer, offset, value); // negative
	      } else {
	        fromArray(buffer, offset, ZERO, 0); // zero, NaN and others
	      }
	    }

	    function fromString(buffer, offset, str, raddix) {
	      var pos = 0;
	      var len = str.length;
	      var high = 0;
	      var low = 0;
	      if (str[0] === "-") pos++;
	      var sign = pos;
	      while (pos < len) {
	        var chr = parseInt(str[pos++], raddix);
	        if (!(chr >= 0)) break; // NaN
	        low = low * raddix + chr;
	        high = high * raddix + Math.floor(low / BIT32);
	        low %= BIT32;
	      }
	      if (sign) {
	        high = ~high;
	        if (low) {
	          low = BIT32 - low;
	        } else {
	          high++;
	        }
	      }
	      writeInt32(buffer, offset + posH, high);
	      writeInt32(buffer, offset + posL, low);
	    }

	    function toNumber() {
	      var buffer = this.buffer;
	      var offset = this.offset;
	      var high = readInt32(buffer, offset + posH);
	      var low = readInt32(buffer, offset + posL);
	      if (!unsigned) high |= 0; // a trick to get signed
	      return high ? (high * BIT32 + low) : low;
	    }

	    function toString(radix) {
	      var buffer = this.buffer;
	      var offset = this.offset;
	      var high = readInt32(buffer, offset + posH);
	      var low = readInt32(buffer, offset + posL);
	      var str = "";
	      var sign = !unsigned && (high & 0x80000000);
	      if (sign) {
	        high = ~high;
	        low = BIT32 - low;
	      }
	      radix = radix || 10;
	      while (1) {
	        var mod = (high % radix) * BIT32 + low;
	        high = Math.floor(high / radix);
	        low = Math.floor(mod / radix);
	        str = (mod % radix).toString(radix) + str;
	        if (!high && !low) break;
	      }
	      if (sign) {
	        str = "-" + str;
	      }
	      return str;
	    }

	    function writeInt32(buffer, offset, value) {
	      buffer[offset + pos3] = value & 255;
	      value = value >> 8;
	      buffer[offset + pos2] = value & 255;
	      value = value >> 8;
	      buffer[offset + pos1] = value & 255;
	      value = value >> 8;
	      buffer[offset + pos0] = value & 255;
	    }

	    function readInt32(buffer, offset) {
	      return (buffer[offset + pos0] * BIT24) +
	        (buffer[offset + pos1] << 16) +
	        (buffer[offset + pos2] << 8) +
	        buffer[offset + pos3];
	    }
	  }

	  function toArray(raw) {
	    var buffer = this.buffer;
	    var offset = this.offset;
	    storage = null; // Array
	    if (raw !== false && offset === 0 && buffer.length === 8 && isArray(buffer)) return buffer;
	    return newArray(buffer, offset);
	  }

	  function toBuffer(raw) {
	    var buffer = this.buffer;
	    var offset = this.offset;
	    storage = BUFFER;
	    if (raw !== false && offset === 0 && buffer.length === 8 && Buffer.isBuffer(buffer)) return buffer;
	    var dest = new BUFFER(8);
	    fromArray(dest, 0, buffer, offset);
	    return dest;
	  }

	  function toArrayBuffer(raw) {
	    var buffer = this.buffer;
	    var offset = this.offset;
	    var arrbuf = buffer.buffer;
	    storage = UINT8ARRAY;
	    if (raw !== false && offset === 0 && (arrbuf instanceof ARRAYBUFFER) && arrbuf.byteLength === 8) return arrbuf;
	    var dest = new UINT8ARRAY(8);
	    fromArray(dest, 0, buffer, offset);
	    return dest.buffer;
	  }

	  function isValidBuffer(buffer, offset) {
	    var len = buffer && buffer.length;
	    offset |= 0;
	    return len && (offset + 8 <= len) && ("string" !== typeof buffer[offset]);
	  }

	  function fromArray(destbuf, destoff, srcbuf, srcoff) {
	    destoff |= 0;
	    srcoff |= 0;
	    for (var i = 0; i < 8; i++) {
	      destbuf[destoff++] = srcbuf[srcoff++] & 255;
	    }
	  }

	  function newArray(buffer, offset) {
	    return Array.prototype.slice.call(buffer, offset, offset + 8);
	  }

	  function fromPositiveBE(buffer, offset, value) {
	    var pos = offset + 8;
	    while (pos > offset) {
	      buffer[--pos] = value & 255;
	      value /= 256;
	    }
	  }

	  function fromNegativeBE(buffer, offset, value) {
	    var pos = offset + 8;
	    value++;
	    while (pos > offset) {
	      buffer[--pos] = ((-value) & 255) ^ 255;
	      value /= 256;
	    }
	  }

	  function fromPositiveLE(buffer, offset, value) {
	    var end = offset + 8;
	    while (offset < end) {
	      buffer[offset++] = value & 255;
	      value /= 256;
	    }
	  }

	  function fromNegativeLE(buffer, offset, value) {
	    var end = offset + 8;
	    value++;
	    while (offset < end) {
	      buffer[offset++] = ((-value) & 255) ^ 255;
	      value /= 256;
	    }
	  }

	  // https://github.com/retrofox/is-array
	  function _isArray(val) {
	    return !!val && "[object Array]" == Object.prototype.toString.call(val);
	  }

	}(typeof exports === 'object' && typeof exports.nodeName !== 'string' ? exports : (this || {}));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).Buffer))

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	// util.js

	var Int64Buffer = __webpack_require__(16);
	var Uint64BE = Int64Buffer.Uint64BE;
	var Int64BE = Int64Buffer.Int64BE;

	var MAXBUFLEN = 8192;

	exports.writeString = writeString;
	exports.readString = readString;
	exports.byteLength = byteLength;
	exports.copy = copy;
	exports.writeUint64BE = writeUint64BE;
	exports.writeInt64BE = writeInt64BE;

	// new Buffer(string, "utf-8") is SLOWER then below

	function writeString(string, start) {
	  var buffer = this;
	  var index = start || 0;
	  var length = string.length;
	  // JavaScript's string uses UTF-16 surrogate pairs for characters other than BMP.
	  // This encodes string as CESU-8 which never reaches 4 octets per character.
	  for (var i = 0; i < length; i++) {
	    var chr = string.charCodeAt(i);
	    if (chr < 0x80) {
	      buffer[index++] = chr;
	    } else if (chr < 0x800) {
	      buffer[index++] = 0xC0 | (chr >> 6);
	      buffer[index++] = 0x80 | (chr & 0x3F);
	    } else {
	      buffer[index++] = 0xE0 | (chr >> 12);
	      buffer[index++] = 0x80 | ((chr >> 6) & 0x3F);
	      buffer[index++] = 0x80 | (chr & 0x3F);
	    }
	  }
	  return index - start;
	}

	// Buffer.ptototype.toString is 2x FASTER then below
	// https://github.com/feross/buffer may throw "Maximum call stack size exceeded." at String.fromCharCode.apply.

	function readString(start, end) {
	  var buffer = this;
	  var index = start - 0 || 0;
	  if (!end) end = buffer.length;
	  var size = end - start;
	  if (size > MAXBUFLEN) size = MAXBUFLEN;
	  var out = [];
	  for (; index < end;) {
	    var array = new Array(size);
	    for (var pos = 0; pos < size && index < end;) {
	      var chr = buffer[index++];
	      chr = (chr < 0x80) ? chr :
	        (chr < 0xE0) ? (((chr & 0x3F) << 6) | (buffer[index++] & 0x3F)) :
	          (((chr & 0x3F) << 12) | ((buffer[index++] & 0x3F) << 6) | ((buffer[index++] & 0x3F)));
	      array[pos++] = chr;
	    }
	    if (pos < size) array = array.slice(0, pos);
	    out.push(String.fromCharCode.apply("", array));
	  }
	  return (out.length > 1) ? out.join("") : out.length ? out.shift() : "";
	}

	// Buffer.byteLength is FASTER than below

	function byteLength(string) {
	  var length = 0 | 0;
	  Array.prototype.forEach.call(string, function(chr) {
	    var code = chr.charCodeAt(0);
	    length += (code < 0x80) ? 1 : (code < 0x800) ? 2 : 3;
	  });
	  return length;
	}

	// https://github.com/feross/buffer lacks descending copying feature

	function copy(target, targetStart, start, end) {
	  var i;
	  if (!start) start = 0;
	  if (!end && end !== 0) end = this.length;
	  if (!targetStart) targetStart = 0;
	  var len = end - start;

	  if (target === this && start < targetStart && targetStart < end) {
	    // descending
	    for (i = len - 1; i >= 0; i--) {
	      target[i + targetStart] = this[i + start];
	    }
	  } else {
	    // ascending
	    for (i = 0; i < len; i++) {
	      target[i + targetStart] = this[i + start];
	    }
	  }

	  return len;
	}

	function writeUint64BE(value, offset) {
	  new Uint64BE(this, offset, value);
	}

	function writeInt64BE(value, offset) {
	  new Int64BE(this, offset, value);
	}


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	// read-token.js

	var ReadFormat = __webpack_require__(15);

	exports.getReadToken = getReadToken;

	function getReadToken(options) {
	  var format = ReadFormat.getReadFormat(options);

	  if (options && options.useraw) {
	    return init_useraw(format);
	  } else {
	    return init_token(format);
	  }
	}

	function init_token(format) {
	  var i;
	  var token = new Array(256);

	  // positive fixint -- 0x00 - 0x7f
	  for (i = 0x00; i <= 0x7f; i++) {
	    token[i] = constant(i);
	  }

	  // fixmap -- 0x80 - 0x8f
	  for (i = 0x80; i <= 0x8f; i++) {
	    token[i] = fix(i - 0x80, format.map);
	  }

	  // fixarray -- 0x90 - 0x9f
	  for (i = 0x90; i <= 0x9f; i++) {
	    token[i] = fix(i - 0x90, format.array);
	  }

	  // fixstr -- 0xa0 - 0xbf
	  for (i = 0xa0; i <= 0xbf; i++) {
	    token[i] = fix(i - 0xa0, format.str);
	  }

	  // nil -- 0xc0
	  token[0xc0] = constant(null);

	  // (never used) -- 0xc1
	  token[0xc1] = null;

	  // false -- 0xc2
	  // true -- 0xc3
	  token[0xc2] = constant(false);
	  token[0xc3] = constant(true);

	  // bin 8 -- 0xc4
	  // bin 16 -- 0xc5
	  // bin 32 -- 0xc6
	  token[0xc4] = flex(format.uint8, format.bin);
	  token[0xc5] = flex(format.uint16, format.bin);
	  token[0xc6] = flex(format.uint32, format.bin);

	  // ext 8 -- 0xc7
	  // ext 16 -- 0xc8
	  // ext 32 -- 0xc9
	  token[0xc7] = flex(format.uint8, format.ext);
	  token[0xc8] = flex(format.uint16, format.ext);
	  token[0xc9] = flex(format.uint32, format.ext);

	  // float 32 -- 0xca
	  // float 64 -- 0xcb
	  token[0xca] = format.float32;
	  token[0xcb] = format.float64;

	  // uint 8 -- 0xcc
	  // uint 16 -- 0xcd
	  // uint 32 -- 0xce
	  // uint 64 -- 0xcf
	  token[0xcc] = format.uint8;
	  token[0xcd] = format.uint16;
	  token[0xce] = format.uint32;
	  token[0xcf] = format.uint64;

	  // int 8 -- 0xd0
	  // int 16 -- 0xd1
	  // int 32 -- 0xd2
	  // int 64 -- 0xd3
	  token[0xd0] = format.int8;
	  token[0xd1] = format.int16;
	  token[0xd2] = format.int32;
	  token[0xd3] = format.int64;

	  // fixext 1 -- 0xd4
	  // fixext 2 -- 0xd5
	  // fixext 4 -- 0xd6
	  // fixext 8 -- 0xd7
	  // fixext 16 -- 0xd8
	  token[0xd4] = fix(1, format.ext);
	  token[0xd5] = fix(2, format.ext);
	  token[0xd6] = fix(4, format.ext);
	  token[0xd7] = fix(8, format.ext);
	  token[0xd8] = fix(16, format.ext);

	  // str 8 -- 0xd9
	  // str 16 -- 0xda
	  // str 32 -- 0xdb
	  token[0xd9] = flex(format.uint8, format.str);
	  token[0xda] = flex(format.uint16, format.str);
	  token[0xdb] = flex(format.uint32, format.str);

	  // array 16 -- 0xdc
	  // array 32 -- 0xdd
	  token[0xdc] = flex(format.uint16, format.array);
	  token[0xdd] = flex(format.uint32, format.array);

	  // map 16 -- 0xde
	  // map 32 -- 0xdf
	  token[0xde] = flex(format.uint16, format.map);
	  token[0xdf] = flex(format.uint32, format.map);

	  // negative fixint -- 0xe0 - 0xff
	  for (i = 0xe0; i <= 0xff; i++) {
	    token[i] = constant(i - 0x100);
	  }

	  return token;
	}

	function init_useraw(format) {
	  var i;
	  var token = getReadToken(format).slice();

	  // raw 8 -- 0xd9
	  // raw 16 -- 0xda
	  // raw 32 -- 0xdb
	  token[0xd9] = token[0xc4];
	  token[0xda] = token[0xc5];
	  token[0xdb] = token[0xc6];

	  // fixraw -- 0xa0 - 0xbf
	  for (i = 0xa0; i <= 0xbf; i++) {
	    token[i] = fix(i - 0xa0, format.bin);
	  }

	  return token;
	}

	function constant(value) {
	  return function() {
	    return value;
	  };
	}

	function flex(lenFunc, decodeFunc) {
	  return function(decoder) {
	    var len = lenFunc(decoder);
	    return decodeFunc(decoder, len);
	  };
	}

	function fix(len, method) {
	  return function(decoder) {
	    return method(decoder, len);
	  };
	}


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	// write-core.js

	exports.getEncoder = getEncoder;

	var WriteType = __webpack_require__(20);

	function getEncoder(options) {
	  var writeType = WriteType.getWriteType(options);
	  return encode;

	  function encode(encoder, value) {
	    var func = writeType[typeof value];
	    if (!func) throw new Error("Unsupported type \"" + (typeof value) + "\": " + value);
	    func(encoder, value);
	  }
	}


/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {// write-type.js

	var IS_ARRAY = __webpack_require__(6);
	var Int64Buffer = __webpack_require__(16);
	var Uint64BE = Int64Buffer.Uint64BE;
	var Int64BE = Int64Buffer.Int64BE;

	var BufferLite = __webpack_require__(17);
	var WriteToken = __webpack_require__(21);
	var uint8 = __webpack_require__(22).uint8;
	var ExtBuffer = __webpack_require__(9).ExtBuffer;

	var IS_BUFFER_SHIM = ("TYPED_ARRAY_SUPPORT" in Buffer);

	var extmap = [];
	extmap[1] = 0xd4;
	extmap[2] = 0xd5;
	extmap[4] = 0xd6;
	extmap[8] = 0xd7;
	extmap[16] = 0xd8;

	exports.getWriteType = getWriteType;

	function getWriteType(options) {
	  var token = WriteToken.getWriteToken(options);

	  var writeType = {
	    "boolean": bool,
	    "function": nil,
	    "number": number,
	    "object": object,
	    "string": string,
	    "symbol": nil,
	    "undefined": nil
	  };

	  if (options && options.useraw) {
	    writeType.object = object_raw;
	    writeType.string = string_raw;
	  }

	  return writeType;

	  // false -- 0xc2
	  // true -- 0xc3
	  function bool(encoder, value) {
	    var type = value ? 0xc3 : 0xc2;
	    token[type](encoder, value);
	  }

	  function number(encoder, value) {
	    var ivalue = value | 0;
	    var type;
	    if (value !== ivalue) {
	      // float 64 -- 0xcb
	      type = 0xcb;
	      token[type](encoder, value);
	      return;
	    } else if (-0x20 <= ivalue && ivalue <= 0x7F) {
	      // positive fixint -- 0x00 - 0x7f
	      // negative fixint -- 0xe0 - 0xff
	      type = ivalue & 0xFF;
	    } else if (0 <= ivalue) {
	      // uint 8 -- 0xcc
	      // uint 16 -- 0xcd
	      // uint 32 -- 0xce
	      type = (ivalue <= 0xFF) ? 0xcc : (ivalue <= 0xFFFF) ? 0xcd : 0xce;
	    } else {
	      // int 8 -- 0xd0
	      // int 16 -- 0xd1
	      // int 32 -- 0xd2
	      type = (-0x80 <= ivalue) ? 0xd0 : (-0x8000 <= ivalue) ? 0xd1 : 0xd2;
	    }
	    token[type](encoder, ivalue);
	  }

	  // uint 64 -- 0xcf
	  function uint64(encoder, value) {
	    var type = 0xcf;
	    token[type](encoder, value.toArray());
	  }

	  // int 64 -- 0xd3
	  function int64(encoder, value) {
	    var type = 0xd3;
	    token[type](encoder, value.toArray());
	  }

	  // str 8 -- 0xd9
	  // str 16 -- 0xda
	  // str 32 -- 0xdb
	  // fixstr -- 0xa0 - 0xbf
	  function string(encoder, value) {
	    // prepare buffer
	    var length = value.length;
	    var maxsize = 5 + length * 3;
	    encoder.reserve(maxsize);

	    // expected header size
	    var expected = (length < 32) ? 1 : (length <= 0xFF) ? 2 : (length <= 0xFFFF) ? 3 : 5;

	    // expected start point
	    var start = encoder.offset + expected;

	    // write string
	    length = BufferLite.writeString.call(encoder.buffer, value, start);

	    // actual header size
	    var actual = (length < 32) ? 1 : (length <= 0xFF) ? 2 : (length <= 0xFFFF) ? 3 : 5;

	    // move content when needed
	    if (expected !== actual) move(encoder, start, length, actual - expected);

	    // write header
	    var type = (actual === 1) ? (0xa0 + length) : (actual <= 3) ? 0xd7 + actual : 0xdb;
	    token[type](encoder, length);

	    // move cursor
	    encoder.offset += length;
	  }

	  function object(encoder, value) {
	    // null
	    if (value === null) return nil(encoder, value);

	    // Buffer
	    if (Buffer.isBuffer(value)) return bin(encoder, value);

	    // Array
	    if (IS_ARRAY(value)) return array(encoder, value);

	    // int64-buffer objects
	    if (Uint64BE.isUint64BE(value)) return uint64(encoder, value);
	    if (Int64BE.isInt64BE(value)) return int64(encoder, value);

	    // ext formats
	    var packer = encoder.codec.getExtPacker(value);
	    if (packer) value = packer(value);
	    if (value instanceof ExtBuffer) return ext(encoder, value);

	    // plain old objects
	    map(encoder, value);
	  }

	  // nil -- 0xc0
	  function nil(encoder, value) {
	    var type = 0xc0;
	    token[type](encoder, value);
	  }

	  // fixarray -- 0x90 - 0x9f
	  // array 16 -- 0xdc
	  // array 32 -- 0xdd
	  function array(encoder, value) {
	    var length = value.length;
	    var type = (length < 16) ? (0x90 + length) : (length <= 0xFFFF) ? 0xdc : 0xdd;
	    token[type](encoder, length);

	    var encode = encoder.codec.encode;
	    for (var i = 0; i < length; i++) {
	      encode(encoder, value[i]);
	    }
	  }

	  // bin 8 -- 0xc4
	  // bin 16 -- 0xc5
	  // bin 32 -- 0xc6
	  function bin(encoder, value) {
	    var length = value.length;
	    var type = (length < 0xFF) ? 0xc4 : (length <= 0xFFFF) ? 0xc5 : 0xc6;
	    token[type](encoder, length);
	    encoder.send(value);
	  }

	  // fixext 1 -- 0xd4
	  // fixext 2 -- 0xd5
	  // fixext 4 -- 0xd6
	  // fixext 8 -- 0xd7
	  // fixext 16 -- 0xd8
	  // ext 8 -- 0xc7
	  // ext 16 -- 0xc8
	  // ext 32 -- 0xc9
	  function ext(encoder, value) {
	    var buffer = value.buffer;
	    var length = buffer.length;
	    var type = extmap[length] || ((length < 0xFF) ? 0xc7 : (length <= 0xFFFF) ? 0xc8 : 0xc9);
	    token[type](encoder, length);
	    uint8[value.type](encoder);
	    encoder.send(buffer);
	  }

	  // fixmap -- 0x80 - 0x8f
	  // map 16 -- 0xde
	  // map 32 -- 0xdf
	  function map(encoder, value) {
	    var keys = Object.keys(value);
	    var length = keys.length;
	    var type = (length < 16) ? (0x80 + length) : (length <= 0xFFFF) ? 0xde : 0xdf;
	    token[type](encoder, length);

	    var encode = encoder.codec.encode;
	    keys.forEach(function(key) {
	      encode(encoder, key);
	      encode(encoder, value[key]);
	    });
	  }

	  // raw 16 -- 0xda
	  // raw 32 -- 0xdb
	  // fixraw -- 0xa0 - 0xbf
	  function string_raw(encoder, value) {
	    // prepare buffer
	    var length = value.length;
	    var maxsize = 5 + length * 3;
	    encoder.reserve(maxsize);

	    // expected header size
	    var expected = (length < 32) ? 1 : (length <= 0xFFFF) ? 3 : 5;

	    // expected start point
	    var start = encoder.offset + expected;

	    // write string
	    length = BufferLite.writeString.call(encoder.buffer, value, start);

	    // actual header size
	    var actual = (length < 32) ? 1 : (length <= 0xFFFF) ? 3 : 5;

	    // move content when needed
	    if (expected !== actual) move(encoder, start, length, actual - expected);

	    // write header
	    var type = (length < 32) ? (0xa0 + length) : (length <= 0xFFFF) ? 0xda : 0xdb;
	    token[type](encoder, length);

	    // move cursor
	    encoder.offset += length;
	  }

	  // raw 16 -- 0xda
	  // raw 32 -- 0xdb
	  // fixraw -- 0xa0 - 0xbf
	  function object_raw(encoder, value) {
	    if (!Buffer.isBuffer(value)) return object(encoder, value);

	    var length = value.length;
	    var type = (length < 32) ? (0xa0 + length) : (length <= 0xFFFF) ? 0xda : 0xdb;
	    token[type](encoder, length);
	    encoder.send(value);
	  }
	}

	function move(encoder, start, length, diff) {
	  var targetStart = start + diff;
	  var end = start + length;
	  if (IS_BUFFER_SHIM) {
	    BufferLite.copy.call(encoder.buffer, encoder.buffer, targetStart, start, end);
	  } else {
	    encoder.buffer.copy(encoder.buffer, targetStart, start, end);
	  }
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).Buffer))

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {// write-token.js

	var BufferLite = __webpack_require__(17);
	var uint8 = __webpack_require__(22).uint8;

	var IS_BUFFER_SHIM = ("TYPED_ARRAY_SUPPORT" in Buffer);
	var NO_TYPED_ARRAY = IS_BUFFER_SHIM && !Buffer.TYPED_ARRAY_SUPPORT;

	exports.getWriteToken = getWriteToken;

	function getWriteToken(options) {
	  if (NO_TYPED_ARRAY || (options && options.safe)) {
	    return init_safe();
	  } else {
	    return init_token();
	  }
	}

	// Node.js and browsers with TypedArray

	function init_token() {
	  // (immediate values)
	  // positive fixint -- 0x00 - 0x7f
	  // nil -- 0xc0
	  // false -- 0xc2
	  // true -- 0xc3
	  // negative fixint -- 0xe0 - 0xff
	  var token = uint8.slice();

	  // bin 8 -- 0xc4
	  // bin 16 -- 0xc5
	  // bin 32 -- 0xc6
	  token[0xc4] = write1(0xc4);
	  token[0xc5] = write2(0xc5);
	  token[0xc6] = write4(0xc6);

	  // ext 8 -- 0xc7
	  // ext 16 -- 0xc8
	  // ext 32 -- 0xc9
	  token[0xc7] = write1(0xc7);
	  token[0xc8] = write2(0xc8);
	  token[0xc9] = write4(0xc9);

	  // float 32 -- 0xca
	  // float 64 -- 0xcb
	  token[0xca] = writeN(0xca, 4, Buffer.prototype.writeFloatBE, true);
	  token[0xcb] = writeN(0xcb, 8, Buffer.prototype.writeDoubleBE, true);

	  // uint 8 -- 0xcc
	  // uint 16 -- 0xcd
	  // uint 32 -- 0xce
	  // uint 64 -- 0xcf
	  token[0xcc] = write1(0xcc);
	  token[0xcd] = write2(0xcd);
	  token[0xce] = write4(0xce);
	  token[0xcf] = writeN(0xcf, 8, BufferLite.writeUint64BE);

	  // int 8 -- 0xd0
	  // int 16 -- 0xd1
	  // int 32 -- 0xd2
	  // int 64 -- 0xd3
	  token[0xd0] = write1(0xd0);
	  token[0xd1] = write2(0xd1);
	  token[0xd2] = write4(0xd2);
	  token[0xd3] = writeN(0xd3, 8, BufferLite.writeUint64BE);

	  // str 8 -- 0xd9
	  // str 16 -- 0xda
	  // str 32 -- 0xdb
	  token[0xd9] = write1(0xd9);
	  token[0xda] = write2(0xda);
	  token[0xdb] = write4(0xdb);

	  // array 16 -- 0xdc
	  // array 32 -- 0xdd
	  token[0xdc] = write2(0xdc);
	  token[0xdd] = write4(0xdd);

	  // map 16 -- 0xde
	  // map 32 -- 0xdf
	  token[0xde] = write2(0xde);
	  token[0xdf] = write4(0xdf);

	  return token;
	}

	// safe mode: for old browsers and who needs asserts

	function init_safe() {
	  // (immediate values)
	  // positive fixint -- 0x00 - 0x7f
	  // nil -- 0xc0
	  // false -- 0xc2
	  // true -- 0xc3
	  // negative fixint -- 0xe0 - 0xff
	  var token = uint8.slice();

	  // bin 8 -- 0xc4
	  // bin 16 -- 0xc5
	  // bin 32 -- 0xc6
	  token[0xc4] = writeN(0xc4, 1, Buffer.prototype.writeUInt8);
	  token[0xc5] = writeN(0xc5, 2, Buffer.prototype.writeUInt16BE);
	  token[0xc6] = writeN(0xc6, 4, Buffer.prototype.writeUInt32BE);

	  // ext 8 -- 0xc7
	  // ext 16 -- 0xc8
	  // ext 32 -- 0xc9
	  token[0xc7] = writeN(0xc7, 1, Buffer.prototype.writeUInt8);
	  token[0xc8] = writeN(0xc8, 2, Buffer.prototype.writeUInt16BE);
	  token[0xc9] = writeN(0xc9, 4, Buffer.prototype.writeUInt32BE);

	  // float 32 -- 0xca
	  // float 64 -- 0xcb
	  token[0xca] = writeN(0xca, 4, Buffer.prototype.writeFloatBE);
	  token[0xcb] = writeN(0xcb, 8, Buffer.prototype.writeDoubleBE);

	  // uint 8 -- 0xcc
	  // uint 16 -- 0xcd
	  // uint 32 -- 0xce
	  // uint 64 -- 0xcf
	  token[0xcc] = writeN(0xcc, 1, Buffer.prototype.writeUInt8);
	  token[0xcd] = writeN(0xcd, 2, Buffer.prototype.writeUInt16BE);
	  token[0xce] = writeN(0xce, 4, Buffer.prototype.writeUInt32BE);
	  token[0xcf] = writeN(0xcf, 8, BufferLite.writeUint64BE);

	  // int 8 -- 0xd0
	  // int 16 -- 0xd1
	  // int 32 -- 0xd2
	  // int 64 -- 0xd3
	  token[0xd0] = writeN(0xd0, 1, Buffer.prototype.writeInt8);
	  token[0xd1] = writeN(0xd1, 2, Buffer.prototype.writeInt16BE);
	  token[0xd2] = writeN(0xd2, 4, Buffer.prototype.writeInt32BE);
	  token[0xd3] = writeN(0xd3, 8, BufferLite.writeUint64BE);

	  // str 8 -- 0xd9
	  // str 16 -- 0xda
	  // str 32 -- 0xdb
	  token[0xd9] = writeN(0xd9, 1, Buffer.prototype.writeUInt8);
	  token[0xda] = writeN(0xda, 2, Buffer.prototype.writeUInt16BE);
	  token[0xdb] = writeN(0xdb, 4, Buffer.prototype.writeUInt32BE);

	  // array 16 -- 0xdc
	  // array 32 -- 0xdd
	  token[0xdc] = writeN(0xdc, 2, Buffer.prototype.writeUInt16BE);
	  token[0xdd] = writeN(0xdd, 4, Buffer.prototype.writeUInt32BE);

	  // map 16 -- 0xde
	  // map 32 -- 0xdf
	  token[0xde] = writeN(0xde, 2, Buffer.prototype.writeUInt16BE);
	  token[0xdf] = writeN(0xdf, 4, Buffer.prototype.writeUInt32BE);

	  return token;
	}

	function write1(type) {
	  return function(encoder, value) {
	    encoder.reserve(2);
	    var buffer = encoder.buffer;
	    var offset = encoder.offset;
	    buffer[offset++] = type;
	    buffer[offset++] = value;
	    encoder.offset = offset;
	  };
	}

	function write2(type) {
	  return function(encoder, value) {
	    encoder.reserve(3);
	    var buffer = encoder.buffer;
	    var offset = encoder.offset;
	    buffer[offset++] = type;
	    buffer[offset++] = value >>> 8;
	    buffer[offset++] = value;
	    encoder.offset = offset;
	  };
	}

	function write4(type) {
	  return function(encoder, value) {
	    encoder.reserve(5);
	    var buffer = encoder.buffer;
	    var offset = encoder.offset;
	    buffer[offset++] = type;
	    buffer[offset++] = value >>> 24;
	    buffer[offset++] = value >>> 16;
	    buffer[offset++] = value >>> 8;
	    buffer[offset++] = value;
	    encoder.offset = offset;
	  };
	}

	function writeN(type, len, method, noAssert) {
	  return function(encoder, value) {
	    encoder.reserve(len + 1);
	    encoder.buffer[encoder.offset++] = type;
	    method.call(encoder.buffer, value, encoder.offset, noAssert);
	    encoder.offset += len;
	  };
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3).Buffer))

/***/ },
/* 22 */
/***/ function(module, exports) {

	// write-unit8.js

	var constant = exports.uint8 = new Array(256);

	for (var i = 0x00; i <= 0xFF; i++) {
	  constant[i] = write0(i);
	}

	function write0(type) {
	  return function(encoder) {
	    encoder.reserve(1);
	    encoder.buffer[encoder.offset++] = type;
	  };
	}


/***/ }
/******/ ]);
  return exports.msgpack;
})();
Primus.prototype.ark["multiplex"] = function client(primus) {

  // multiplex instance.
  var multiplex = new Primus.$.multiplex.Multiplex(primus);

  /**
   * Return a `Channel` instance.
   *
   * @param {String} name The channel name.
   * @return {multiplex.Spark}
   * @api public
   */

  primus.channel = function channel(name) {
    return multiplex.channel(name);
  };
};
Primus.prototype.ark["emitter"] = function () {};
  return Primus;
},
[
function (Primus) {
;(function (Primus, undefined) {
function spark() {

  'use strict';

  var slice = Array.prototype.slice
    , nextTick
    , Stream;

  /**
   * Module dependencies.
   */

  try {
    Stream = require('stream');
    nextTick = process.nextTick;
  } catch (e) {
    Stream = Primus.EventEmitter;
    nextTick = function tick(fn) {
      setTimeout(fn, 0);
    };
  }

  function inherit(a, b) {
    function F() {}
    F.prototype = b.prototype;
    a.prototype = new F();
    a.prototype.constructor = a;
  }

  /**
   * `Spark` constructor.
   *
   * @constructor
   * @param {Multiplex} Multiplex instance.
   * @param {String|Number} id.
   * @param {primus.Spark} conn.
   * @api public
   */

  function Spark(mp, channel, id) {
    if (!(this instanceof Spark)) return new Spark(mp, channel, id);
    Stream.call(this);
    this.channel = channel;
    this.id = id || this.uid(13);
    this.packets = mp.packets;
    this.conn = mp.conn;
    this.readyState = mp.conn.readyState;
    this.channels = mp.channels;
    this.writable = true;
    this.readable = true;
    this.reconnect = false;
    this.initialise();
  }

  /**
   * Inherits from `EventEmitter`.
   */

  inherit(Spark, Stream);

  /**
   * Initialise the Primus and setup all
   * parsers and internal listeners.
   *
   * @api private
   */

  Spark.prototype.initialise = function initialise() {
    var listeners = []
      , spark = this
      , events = []
      , i;

    for (var ev in this.conn.reserved.events) {
      if ('data' === ev || 'end' === ev) continue;
      events.push(ev);
    }

    // This listener must be registered before other ones
    // to make sure readyState is set when the others are called
    this.conn.on('readyStateChange', onreadystatechange);

    this.conn.on('reconnect', onreconnect);
    this.conn.on('open', onopen);

    // Connect to the actual channel
    this.connect();

    // Re-emit events from main connection
    for (i = 0; i < events.length; i++) {
      listeners.push(proxy(events[i]));
      this.conn.on(events[i], listeners[i]);
    }

    this.on('end', function () {
      spark.emit('close');
      spark.conn.removeListener('readyStateChange', onreadystatechange);
      spark.conn.removeListener('reconnect', onreconnect);
      spark.conn.removeListener('open', onopen);
      for (i = 0; i < events.length; i++) {
        spark.conn.removeListener(events[i], listeners[i]);
      }
    });

    function onreadystatechange() {
      spark.readyState = spark.conn.readyState;
    }

    function onreconnect() {
      spark.reconnect = true;
    }

    function onopen() {
      if (spark.reconnect) spark.connect();
      spark.reconnect = false;
    }

    function proxy(ev) {
      return function emit() {
        spark.emit.apply(spark, [ev].concat(slice.call(arguments)));
      };
    }

    return this;
  };

  /**
   * Connect to the `channel`.
   *
   * @return {Socket} self
   * @api public
   */

  Spark.prototype.connect = function connect() {
    // Subscribe to channel
    this.conn.write(this.packet.call(this, 'SUBSCRIBE'));
    return this;
  };

  /**
   * Send a new message to a given spark.
   *
   * @param {Mixed} data The data that needs to be written.
   * @returns {Boolean} Always returns true.
   * @api public
   */

  Spark.prototype.write = function write(data) {
    var payload = this.packet('MESSAGE', data);
    return this.conn.write(payload);
  };

  /**
   * End the connection.
   *
   * @param {Mixed} data Optional closing data.
   * @param {Function} fn Optional callback function.
   * @return {Channel} self
   * @api public
   */

  Spark.prototype.end = function end(data) {
    var spark = this;
    if (data) this.write(data);
    this.conn.write(this.packet('UNSUBSCRIBE'));
    nextTick(function tick() {
      spark.emit('end');
      spark.writable = false;
    });
    delete this.channels[this.channel][this.id];
    return this;
  };

  /**
   * Generate a unique id.
   *
   * @param {String} len
   * @return {String} uid.
   * @api private
   */

  Spark.prototype.uid = function uid(len) {
    return Math.random().toString(35).substr(2, len || 7);
  };

  /**
   * Encode data to return a multiplex packet.
   * @param {String} ev
   * @param {Object} data
   * @return {Object} pack
   * @api private
   */

  Spark.prototype.packet = function packet(ev, data) {
    var type = this.packets[ev];
    var pack = [type, this.id, this.channel];
    if (data) pack.push(data);
    return pack;
  };

  /**
   * Checks if the given event is an emitted event by Primus.
   *
   * @param {String} evt The event name.
   * @returns {Boolean}
   * @api public
   */

  Spark.prototype.reserved = function reserved(evt) {
    return (/^(incoming|outgoing)::/).test(evt)
      || evt in this.conn.reserved.events
      || evt in this.reserved.events;
  };

  /**
   * The reserved custom events list.
   *
   * @type {Object}
   * @api public
   */

  Spark.prototype.reserved.events = {};

  return Spark;
}
function multiplex(Spark) {

  'use strict';

  /**
   * `Multiplex` constructor.
   *
   * @constructor
   * @param {Primus} primus Primus instance.
   * @param {Object} options The options.
   * @api public
   */

  function Multiplex(primus, options) {
    if (!(this instanceof Multiplex)) return new Multiplex(primus, options);
    options = options || {};
    this.conn = primus;
    this.channels = {};
    this.reconnect = false;
    if (this.conn) this.bind();
  }

  /**
   * Message packets.
   */

  Multiplex.prototype.packets = {
    MESSAGE: 0,
    SUBSCRIBE: 1,
    UNSUBSCRIBE: 2
  };

  /**
   * Bind `Multiplex` events.
   *
   * @return {Multiplex} self
   * @api private
   */

  Multiplex.prototype.bind = function bind() {
    var mp = this;
    this.conn.on('data', function ondata(data) {
      if (isArray(data)) {
        var type = data[0]
          , id = data[1]
          , name = data[2]
          , payload = data.length === 4 ? data[3] : undefined
          , channel = mp.channels[name][id];

        if (!channel) return false;

        switch (type) {
          case mp.packets.MESSAGE:
            channel.emit('data', payload);
            break;
          case mp.packets.UNSUBSCRIBE:
              channel.emit('end');
              channel.removeAllListeners();
              delete mp.channels[name][id];
            break;
        }
        return false;
      }
    });

    return this;
  };

  /**
   * Return a `Channel` instance.
   *
   * @param {String} name The channel name.
   * @return {Spark}
   * @api public
   */

  Multiplex.prototype.channel = function channel(name) {
    if (!name) return this.conn;

    // extend Spark to use emitter if this
    // the plugin its present.
    if ('emitter' in Primus.$) {
      Primus.$.emitter.spark(Spark, Primus.$.emitter.emitter());
    }

    var spark = new Spark(this, name);
    var id = spark.id;
    this.channels[name] =
    this.channels[name] || {};
    this.channels[name][id] = spark;
    return spark;
  };

  /**
   * Check if object is an array.
   */

  function isArray(obj) {
    return '[object Array]' === Object.prototype.toString.call(obj);
  }

  return Multiplex;
}
 if (undefined === Primus) return;
 var Spark = spark();
 Primus.$ = Primus.$ || {};
 Primus.$.multiplex = {}
 Primus.$.multiplex.spark = spark;
 Primus.$.multiplex.multiplex = multiplex;
 Primus.$.multiplex.Multiplex = multiplex(Spark);
})(Primus);
},
function (Primus) {
;(function (Primus, undefined) {
function spark(Spark, Emitter) {
  'use strict';

  /**
   * `Primus#initialise` reference.
   */

  var initialise = Spark.prototype.initialise;

  /**
   * Initialise the Primus and setup all
   * parsers and internal listeners.
   *
   * @api private
   */

  Spark.prototype.initialise = function init() {
    if (!this.emitter) this.emitter = new Emitter(this);
    if (!this.__initialise) initialise.apply(this, arguments);
  };

  // Extend the Spark to add the send method. If `Spark.readable`
  // is not supported then we set the method on the prototype instead.
  if (!Spark.readable) Spark.prototype.send = send;
  else if (!Spark.prototype.send) Spark.readable('send', send);

  /**
   * Emits to this Spark.
   *
   * @param {String} ev The event
   * @param {Mixed} [data] The data to broadcast
   * @param {Function} [fn] The callback function
   * @return {Primus|Spark} this
   * @api public
   */

  function send(ev, data, fn) {
    /* jshint validthis: true */
    // ignore newListener event to avoid this error in node 0.8
    // https://github.com/cayasso/primus-emitter/issues/3
    if (/^(newListener|removeListener)/.test(ev)) return this;
    this.emitter.send.apply(this.emitter, arguments);
    return this;
  }
}
function emitter() {
  'use strict';

  var toString = Object.prototype.toString
    , slice = Array.prototype.slice;

  /**
   * Check if the given `value` is an `Array`.
   *
   * @param {*} value The value to check
   * @return {Boolean}
   */

  var isArray = Array.isArray || function isArray(value) {
    return '[object Array]' === toString.call(value);
  };

  /**
   * Event packets.
   */

  var packets = {
    EVENT:  0,
    ACK:    1
  };

  /**
   * Initialize a new `Emitter`.
   *
   * @param {Primus|Spark} conn
   * @return {Emitter} `Emitter` instance
   * @api public
   */

  function Emitter(conn) {
    if (!(this instanceof Emitter)) return new Emitter(conn);
    this.ids = 1;
    this.acks = {};
    this.conn = conn;
    if (this.conn) this.bind();
  }

  /**
   * Bind `Emitter` events.
   *
   * @return {Emitter} self
   * @api private
   */

  Emitter.prototype.bind = function bind() {
    var em = this;
    this.conn.on('data', function ondata(packet) {
      em.ondata.call(em, packet);
    });
    return this;
  };

  /**
   * Called with incoming transport data.
   *
   * @param {Object} packet
   * @return {Emitter} self
   * @api private
   */

  Emitter.prototype.ondata = function ondata(packet) {
    if (!isArray(packet.data) || packet.id && 'number' !== typeof packet.id) {
      return this;
    }
    switch (packet.type) {
      case packets.EVENT:
        this.onevent(packet);
        break;
      case packets.ACK:
        this.onack(packet);
    }
    return this;
  };

  /**
   * Send a message to client.
   *
   * @return {Emitter} self
   * @api public
   */

  Emitter.prototype.send = function send() {
    var args = slice.call(arguments);
    this.conn.write(this.packet(args));
    return this;
  };

  /**
   * Prepare packet for emitting.
   *
   * @param {Array} arguments
   * @return {Object} packet
   * @api private
   */

  Emitter.prototype.packet = function pack(args) {
    var packet = { type: packets.EVENT, data: args };
    // access last argument to see if it's an ACK callback
    if ('function' === typeof args[args.length - 1]) {
      var id = this.ids++;
      this.acks[id] = args.pop();
      packet.id = id;
    }
    return packet;
  };

  /**
   * Called upon event packet.
   *
   * @param {Object} packet object
   * @return {Emitter} self
   * @api private
   */

  Emitter.prototype.onevent = function onevent(packet) {
    var args = packet.data;
    if (this.conn.reserved(args[0])) return this;
    if (packet.id) args.push(this.ack(packet.id));
    this.conn.emit.apply(this.conn, args);
    return this;
  };

  /**
   * Produces an ack callback to emit with an event.
   *
   * @param {Number} packet id
   * @return {Function}
   * @api private
   */

  Emitter.prototype.ack = function ack(id) {
    var conn = this.conn
      , sent = false;
    return function () {
      if (sent) return; // prevent double callbacks
      sent = true;
      conn.write({
        id: id,
        type: packets.ACK,
        data: slice.call(arguments)
      });
    };
  };

  /**
   * Called upon ack packet.
   *
   * @param {Object} packet object
   * @return {Emitter} self
   * @api private
   */

  Emitter.prototype.onack = function onack(packet) {
    var ack = this.acks[packet.id];
    if ('function' === typeof ack) {
      ack.apply(this, packet.data);
      delete this.acks[packet.id];
    }
    return this;
  };

  // Expose packets
  Emitter.packets = packets;

  return Emitter;
}
 if (undefined === Primus) return;
 Primus.$ = Primus.$ || {};
 Primus.$.emitter = {};
 Primus.$.emitter.spark = spark;
 Primus.$.emitter.emitter = emitter;
 spark(Primus, emitter());
})(Primus);
}
]);