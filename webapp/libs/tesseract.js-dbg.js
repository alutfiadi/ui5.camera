sap.ui.define((function () { 'use strict';

  var runtime = {exports: {}};

  /**
   * Copyright (c) 2014-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */

  (function (module) {
  	var runtime = (function (exports) {

  	  var Op = Object.prototype;
  	  var hasOwn = Op.hasOwnProperty;
  	  var defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; };
  	  var undefined$1; // More compressible than void 0.
  	  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  	  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  	  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  	  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  	  function define(obj, key, value) {
  	    Object.defineProperty(obj, key, {
  	      value: value,
  	      enumerable: true,
  	      configurable: true,
  	      writable: true
  	    });
  	    return obj[key];
  	  }
  	  try {
  	    // IE 8 has a broken Object.defineProperty that only works on DOM objects.
  	    define({}, "");
  	  } catch (err) {
  	    define = function(obj, key, value) {
  	      return obj[key] = value;
  	    };
  	  }

  	  function wrap(innerFn, outerFn, self, tryLocsList) {
  	    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
  	    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
  	    var generator = Object.create(protoGenerator.prototype);
  	    var context = new Context(tryLocsList || []);

  	    // The ._invoke method unifies the implementations of the .next,
  	    // .throw, and .return methods.
  	    defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) });

  	    return generator;
  	  }
  	  exports.wrap = wrap;

  	  // Try/catch helper to minimize deoptimizations. Returns a completion
  	  // record like context.tryEntries[i].completion. This interface could
  	  // have been (and was previously) designed to take a closure to be
  	  // invoked without arguments, but in all the cases we care about we
  	  // already have an existing method we want to call, so there's no need
  	  // to create a new function object. We can even get away with assuming
  	  // the method takes exactly one argument, since that happens to be true
  	  // in every case, so we don't have to touch the arguments object. The
  	  // only additional allocation required is the completion record, which
  	  // has a stable shape and so hopefully should be cheap to allocate.
  	  function tryCatch(fn, obj, arg) {
  	    try {
  	      return { type: "normal", arg: fn.call(obj, arg) };
  	    } catch (err) {
  	      return { type: "throw", arg: err };
  	    }
  	  }

  	  var GenStateSuspendedStart = "suspendedStart";
  	  var GenStateSuspendedYield = "suspendedYield";
  	  var GenStateExecuting = "executing";
  	  var GenStateCompleted = "completed";

  	  // Returning this object from the innerFn has the same effect as
  	  // breaking out of the dispatch switch statement.
  	  var ContinueSentinel = {};

  	  // Dummy constructor functions that we use as the .constructor and
  	  // .constructor.prototype properties for functions that return Generator
  	  // objects. For full spec compliance, you may wish to configure your
  	  // minifier not to mangle the names of these two functions.
  	  function Generator() {}
  	  function GeneratorFunction() {}
  	  function GeneratorFunctionPrototype() {}

  	  // This is a polyfill for %IteratorPrototype% for environments that
  	  // don't natively support it.
  	  var IteratorPrototype = {};
  	  define(IteratorPrototype, iteratorSymbol, function () {
  	    return this;
  	  });

  	  var getProto = Object.getPrototypeOf;
  	  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  	  if (NativeIteratorPrototype &&
  	      NativeIteratorPrototype !== Op &&
  	      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
  	    // This environment has a native %IteratorPrototype%; use it instead
  	    // of the polyfill.
  	    IteratorPrototype = NativeIteratorPrototype;
  	  }

  	  var Gp = GeneratorFunctionPrototype.prototype =
  	    Generator.prototype = Object.create(IteratorPrototype);
  	  GeneratorFunction.prototype = GeneratorFunctionPrototype;
  	  defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: true });
  	  defineProperty(
  	    GeneratorFunctionPrototype,
  	    "constructor",
  	    { value: GeneratorFunction, configurable: true }
  	  );
  	  GeneratorFunction.displayName = define(
  	    GeneratorFunctionPrototype,
  	    toStringTagSymbol,
  	    "GeneratorFunction"
  	  );

  	  // Helper for defining the .next, .throw, and .return methods of the
  	  // Iterator interface in terms of a single ._invoke method.
  	  function defineIteratorMethods(prototype) {
  	    ["next", "throw", "return"].forEach(function(method) {
  	      define(prototype, method, function(arg) {
  	        return this._invoke(method, arg);
  	      });
  	    });
  	  }

  	  exports.isGeneratorFunction = function(genFun) {
  	    var ctor = typeof genFun === "function" && genFun.constructor;
  	    return ctor
  	      ? ctor === GeneratorFunction ||
  	        // For the native GeneratorFunction constructor, the best we can
  	        // do is to check its .name property.
  	        (ctor.displayName || ctor.name) === "GeneratorFunction"
  	      : false;
  	  };

  	  exports.mark = function(genFun) {
  	    if (Object.setPrototypeOf) {
  	      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
  	    } else {
  	      genFun.__proto__ = GeneratorFunctionPrototype;
  	      define(genFun, toStringTagSymbol, "GeneratorFunction");
  	    }
  	    genFun.prototype = Object.create(Gp);
  	    return genFun;
  	  };

  	  // Within the body of any async function, `await x` is transformed to
  	  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  	  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  	  // meant to be awaited.
  	  exports.awrap = function(arg) {
  	    return { __await: arg };
  	  };

  	  function AsyncIterator(generator, PromiseImpl) {
  	    function invoke(method, arg, resolve, reject) {
  	      var record = tryCatch(generator[method], generator, arg);
  	      if (record.type === "throw") {
  	        reject(record.arg);
  	      } else {
  	        var result = record.arg;
  	        var value = result.value;
  	        if (value &&
  	            typeof value === "object" &&
  	            hasOwn.call(value, "__await")) {
  	          return PromiseImpl.resolve(value.__await).then(function(value) {
  	            invoke("next", value, resolve, reject);
  	          }, function(err) {
  	            invoke("throw", err, resolve, reject);
  	          });
  	        }

  	        return PromiseImpl.resolve(value).then(function(unwrapped) {
  	          // When a yielded Promise is resolved, its final value becomes
  	          // the .value of the Promise<{value,done}> result for the
  	          // current iteration.
  	          result.value = unwrapped;
  	          resolve(result);
  	        }, function(error) {
  	          // If a rejected Promise was yielded, throw the rejection back
  	          // into the async generator function so it can be handled there.
  	          return invoke("throw", error, resolve, reject);
  	        });
  	      }
  	    }

  	    var previousPromise;

  	    function enqueue(method, arg) {
  	      function callInvokeWithMethodAndArg() {
  	        return new PromiseImpl(function(resolve, reject) {
  	          invoke(method, arg, resolve, reject);
  	        });
  	      }

  	      return previousPromise =
  	        // If enqueue has been called before, then we want to wait until
  	        // all previous Promises have been resolved before calling invoke,
  	        // so that results are always delivered in the correct order. If
  	        // enqueue has not been called before, then it is important to
  	        // call invoke immediately, without waiting on a callback to fire,
  	        // so that the async generator function has the opportunity to do
  	        // any necessary setup in a predictable way. This predictability
  	        // is why the Promise constructor synchronously invokes its
  	        // executor callback, and why async functions synchronously
  	        // execute code before the first await. Since we implement simple
  	        // async functions in terms of async generators, it is especially
  	        // important to get this right, even though it requires care.
  	        previousPromise ? previousPromise.then(
  	          callInvokeWithMethodAndArg,
  	          // Avoid propagating failures to Promises returned by later
  	          // invocations of the iterator.
  	          callInvokeWithMethodAndArg
  	        ) : callInvokeWithMethodAndArg();
  	    }

  	    // Define the unified helper method that is used to implement .next,
  	    // .throw, and .return (see defineIteratorMethods).
  	    defineProperty(this, "_invoke", { value: enqueue });
  	  }

  	  defineIteratorMethods(AsyncIterator.prototype);
  	  define(AsyncIterator.prototype, asyncIteratorSymbol, function () {
  	    return this;
  	  });
  	  exports.AsyncIterator = AsyncIterator;

  	  // Note that simple async functions are implemented on top of
  	  // AsyncIterator objects; they just return a Promise for the value of
  	  // the final result produced by the iterator.
  	  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
  	    if (PromiseImpl === void 0) PromiseImpl = Promise;

  	    var iter = new AsyncIterator(
  	      wrap(innerFn, outerFn, self, tryLocsList),
  	      PromiseImpl
  	    );

  	    return exports.isGeneratorFunction(outerFn)
  	      ? iter // If outerFn is a generator, return the full iterator.
  	      : iter.next().then(function(result) {
  	          return result.done ? result.value : iter.next();
  	        });
  	  };

  	  function makeInvokeMethod(innerFn, self, context) {
  	    var state = GenStateSuspendedStart;

  	    return function invoke(method, arg) {
  	      if (state === GenStateExecuting) {
  	        throw new Error("Generator is already running");
  	      }

  	      if (state === GenStateCompleted) {
  	        if (method === "throw") {
  	          throw arg;
  	        }

  	        // Be forgiving, per 25.3.3.3.3 of the spec:
  	        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
  	        return doneResult();
  	      }

  	      context.method = method;
  	      context.arg = arg;

  	      while (true) {
  	        var delegate = context.delegate;
  	        if (delegate) {
  	          var delegateResult = maybeInvokeDelegate(delegate, context);
  	          if (delegateResult) {
  	            if (delegateResult === ContinueSentinel) continue;
  	            return delegateResult;
  	          }
  	        }

  	        if (context.method === "next") {
  	          // Setting context._sent for legacy support of Babel's
  	          // function.sent implementation.
  	          context.sent = context._sent = context.arg;

  	        } else if (context.method === "throw") {
  	          if (state === GenStateSuspendedStart) {
  	            state = GenStateCompleted;
  	            throw context.arg;
  	          }

  	          context.dispatchException(context.arg);

  	        } else if (context.method === "return") {
  	          context.abrupt("return", context.arg);
  	        }

  	        state = GenStateExecuting;

  	        var record = tryCatch(innerFn, self, context);
  	        if (record.type === "normal") {
  	          // If an exception is thrown from innerFn, we leave state ===
  	          // GenStateExecuting and loop back for another invocation.
  	          state = context.done
  	            ? GenStateCompleted
  	            : GenStateSuspendedYield;

  	          if (record.arg === ContinueSentinel) {
  	            continue;
  	          }

  	          return {
  	            value: record.arg,
  	            done: context.done
  	          };

  	        } else if (record.type === "throw") {
  	          state = GenStateCompleted;
  	          // Dispatch the exception by looping back around to the
  	          // context.dispatchException(context.arg) call above.
  	          context.method = "throw";
  	          context.arg = record.arg;
  	        }
  	      }
  	    };
  	  }

  	  // Call delegate.iterator[context.method](context.arg) and handle the
  	  // result, either by returning a { value, done } result from the
  	  // delegate iterator, or by modifying context.method and context.arg,
  	  // setting context.delegate to null, and returning the ContinueSentinel.
  	  function maybeInvokeDelegate(delegate, context) {
  	    var methodName = context.method;
  	    var method = delegate.iterator[methodName];
  	    if (method === undefined$1) {
  	      // A .throw or .return when the delegate iterator has no .throw
  	      // method, or a missing .next mehtod, always terminate the
  	      // yield* loop.
  	      context.delegate = null;

  	      // Note: ["return"] must be used for ES3 parsing compatibility.
  	      if (methodName === "throw" && delegate.iterator["return"]) {
  	        // If the delegate iterator has a return method, give it a
  	        // chance to clean up.
  	        context.method = "return";
  	        context.arg = undefined$1;
  	        maybeInvokeDelegate(delegate, context);

  	        if (context.method === "throw") {
  	          // If maybeInvokeDelegate(context) changed context.method from
  	          // "return" to "throw", let that override the TypeError below.
  	          return ContinueSentinel;
  	        }
  	      }
  	      if (methodName !== "return") {
  	        context.method = "throw";
  	        context.arg = new TypeError(
  	          "The iterator does not provide a '" + methodName + "' method");
  	      }

  	      return ContinueSentinel;
  	    }

  	    var record = tryCatch(method, delegate.iterator, context.arg);

  	    if (record.type === "throw") {
  	      context.method = "throw";
  	      context.arg = record.arg;
  	      context.delegate = null;
  	      return ContinueSentinel;
  	    }

  	    var info = record.arg;

  	    if (! info) {
  	      context.method = "throw";
  	      context.arg = new TypeError("iterator result is not an object");
  	      context.delegate = null;
  	      return ContinueSentinel;
  	    }

  	    if (info.done) {
  	      // Assign the result of the finished delegate to the temporary
  	      // variable specified by delegate.resultName (see delegateYield).
  	      context[delegate.resultName] = info.value;

  	      // Resume execution at the desired location (see delegateYield).
  	      context.next = delegate.nextLoc;

  	      // If context.method was "throw" but the delegate handled the
  	      // exception, let the outer generator proceed normally. If
  	      // context.method was "next", forget context.arg since it has been
  	      // "consumed" by the delegate iterator. If context.method was
  	      // "return", allow the original .return call to continue in the
  	      // outer generator.
  	      if (context.method !== "return") {
  	        context.method = "next";
  	        context.arg = undefined$1;
  	      }

  	    } else {
  	      // Re-yield the result returned by the delegate method.
  	      return info;
  	    }

  	    // The delegate iterator is finished, so forget it and continue with
  	    // the outer generator.
  	    context.delegate = null;
  	    return ContinueSentinel;
  	  }

  	  // Define Generator.prototype.{next,throw,return} in terms of the
  	  // unified ._invoke helper method.
  	  defineIteratorMethods(Gp);

  	  define(Gp, toStringTagSymbol, "Generator");

  	  // A Generator should always return itself as the iterator object when the
  	  // @@iterator function is called on it. Some browsers' implementations of the
  	  // iterator prototype chain incorrectly implement this, causing the Generator
  	  // object to not be returned from this call. This ensures that doesn't happen.
  	  // See https://github.com/facebook/regenerator/issues/274 for more details.
  	  define(Gp, iteratorSymbol, function() {
  	    return this;
  	  });

  	  define(Gp, "toString", function() {
  	    return "[object Generator]";
  	  });

  	  function pushTryEntry(locs) {
  	    var entry = { tryLoc: locs[0] };

  	    if (1 in locs) {
  	      entry.catchLoc = locs[1];
  	    }

  	    if (2 in locs) {
  	      entry.finallyLoc = locs[2];
  	      entry.afterLoc = locs[3];
  	    }

  	    this.tryEntries.push(entry);
  	  }

  	  function resetTryEntry(entry) {
  	    var record = entry.completion || {};
  	    record.type = "normal";
  	    delete record.arg;
  	    entry.completion = record;
  	  }

  	  function Context(tryLocsList) {
  	    // The root entry object (effectively a try statement without a catch
  	    // or a finally block) gives us a place to store values thrown from
  	    // locations where there is no enclosing try statement.
  	    this.tryEntries = [{ tryLoc: "root" }];
  	    tryLocsList.forEach(pushTryEntry, this);
  	    this.reset(true);
  	  }

  	  exports.keys = function(val) {
  	    var object = Object(val);
  	    var keys = [];
  	    for (var key in object) {
  	      keys.push(key);
  	    }
  	    keys.reverse();

  	    // Rather than returning an object with a next method, we keep
  	    // things simple and return the next function itself.
  	    return function next() {
  	      while (keys.length) {
  	        var key = keys.pop();
  	        if (key in object) {
  	          next.value = key;
  	          next.done = false;
  	          return next;
  	        }
  	      }

  	      // To avoid creating an additional object, we just hang the .value
  	      // and .done properties off the next function object itself. This
  	      // also ensures that the minifier will not anonymize the function.
  	      next.done = true;
  	      return next;
  	    };
  	  };

  	  function values(iterable) {
  	    if (iterable || iterable === "") {
  	      var iteratorMethod = iterable[iteratorSymbol];
  	      if (iteratorMethod) {
  	        return iteratorMethod.call(iterable);
  	      }

  	      if (typeof iterable.next === "function") {
  	        return iterable;
  	      }

  	      if (!isNaN(iterable.length)) {
  	        var i = -1, next = function next() {
  	          while (++i < iterable.length) {
  	            if (hasOwn.call(iterable, i)) {
  	              next.value = iterable[i];
  	              next.done = false;
  	              return next;
  	            }
  	          }

  	          next.value = undefined$1;
  	          next.done = true;

  	          return next;
  	        };

  	        return next.next = next;
  	      }
  	    }

  	    throw new TypeError(typeof iterable + " is not iterable");
  	  }
  	  exports.values = values;

  	  function doneResult() {
  	    return { value: undefined$1, done: true };
  	  }

  	  Context.prototype = {
  	    constructor: Context,

  	    reset: function(skipTempReset) {
  	      this.prev = 0;
  	      this.next = 0;
  	      // Resetting context._sent for legacy support of Babel's
  	      // function.sent implementation.
  	      this.sent = this._sent = undefined$1;
  	      this.done = false;
  	      this.delegate = null;

  	      this.method = "next";
  	      this.arg = undefined$1;

  	      this.tryEntries.forEach(resetTryEntry);

  	      if (!skipTempReset) {
  	        for (var name in this) {
  	          // Not sure about the optimal order of these conditions:
  	          if (name.charAt(0) === "t" &&
  	              hasOwn.call(this, name) &&
  	              !isNaN(+name.slice(1))) {
  	            this[name] = undefined$1;
  	          }
  	        }
  	      }
  	    },

  	    stop: function() {
  	      this.done = true;

  	      var rootEntry = this.tryEntries[0];
  	      var rootRecord = rootEntry.completion;
  	      if (rootRecord.type === "throw") {
  	        throw rootRecord.arg;
  	      }

  	      return this.rval;
  	    },

  	    dispatchException: function(exception) {
  	      if (this.done) {
  	        throw exception;
  	      }

  	      var context = this;
  	      function handle(loc, caught) {
  	        record.type = "throw";
  	        record.arg = exception;
  	        context.next = loc;

  	        if (caught) {
  	          // If the dispatched exception was caught by a catch block,
  	          // then let that catch block handle the exception normally.
  	          context.method = "next";
  	          context.arg = undefined$1;
  	        }

  	        return !! caught;
  	      }

  	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
  	        var entry = this.tryEntries[i];
  	        var record = entry.completion;

  	        if (entry.tryLoc === "root") {
  	          // Exception thrown outside of any try block that could handle
  	          // it, so set the completion value of the entire function to
  	          // throw the exception.
  	          return handle("end");
  	        }

  	        if (entry.tryLoc <= this.prev) {
  	          var hasCatch = hasOwn.call(entry, "catchLoc");
  	          var hasFinally = hasOwn.call(entry, "finallyLoc");

  	          if (hasCatch && hasFinally) {
  	            if (this.prev < entry.catchLoc) {
  	              return handle(entry.catchLoc, true);
  	            } else if (this.prev < entry.finallyLoc) {
  	              return handle(entry.finallyLoc);
  	            }

  	          } else if (hasCatch) {
  	            if (this.prev < entry.catchLoc) {
  	              return handle(entry.catchLoc, true);
  	            }

  	          } else if (hasFinally) {
  	            if (this.prev < entry.finallyLoc) {
  	              return handle(entry.finallyLoc);
  	            }

  	          } else {
  	            throw new Error("try statement without catch or finally");
  	          }
  	        }
  	      }
  	    },

  	    abrupt: function(type, arg) {
  	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
  	        var entry = this.tryEntries[i];
  	        if (entry.tryLoc <= this.prev &&
  	            hasOwn.call(entry, "finallyLoc") &&
  	            this.prev < entry.finallyLoc) {
  	          var finallyEntry = entry;
  	          break;
  	        }
  	      }

  	      if (finallyEntry &&
  	          (type === "break" ||
  	           type === "continue") &&
  	          finallyEntry.tryLoc <= arg &&
  	          arg <= finallyEntry.finallyLoc) {
  	        // Ignore the finally entry if control is not jumping to a
  	        // location outside the try/catch block.
  	        finallyEntry = null;
  	      }

  	      var record = finallyEntry ? finallyEntry.completion : {};
  	      record.type = type;
  	      record.arg = arg;

  	      if (finallyEntry) {
  	        this.method = "next";
  	        this.next = finallyEntry.finallyLoc;
  	        return ContinueSentinel;
  	      }

  	      return this.complete(record);
  	    },

  	    complete: function(record, afterLoc) {
  	      if (record.type === "throw") {
  	        throw record.arg;
  	      }

  	      if (record.type === "break" ||
  	          record.type === "continue") {
  	        this.next = record.arg;
  	      } else if (record.type === "return") {
  	        this.rval = this.arg = record.arg;
  	        this.method = "return";
  	        this.next = "end";
  	      } else if (record.type === "normal" && afterLoc) {
  	        this.next = afterLoc;
  	      }

  	      return ContinueSentinel;
  	    },

  	    finish: function(finallyLoc) {
  	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
  	        var entry = this.tryEntries[i];
  	        if (entry.finallyLoc === finallyLoc) {
  	          this.complete(entry.completion, entry.afterLoc);
  	          resetTryEntry(entry);
  	          return ContinueSentinel;
  	        }
  	      }
  	    },

  	    "catch": function(tryLoc) {
  	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
  	        var entry = this.tryEntries[i];
  	        if (entry.tryLoc === tryLoc) {
  	          var record = entry.completion;
  	          if (record.type === "throw") {
  	            var thrown = record.arg;
  	            resetTryEntry(entry);
  	          }
  	          return thrown;
  	        }
  	      }

  	      // The context.catch method must only be called with a location
  	      // argument that corresponds to a known catch block.
  	      throw new Error("illegal catch attempt");
  	    },

  	    delegateYield: function(iterable, resultName, nextLoc) {
  	      this.delegate = {
  	        iterator: values(iterable),
  	        resultName: resultName,
  	        nextLoc: nextLoc
  	      };

  	      if (this.method === "next") {
  	        // Deliberately forget the last sent value so that we don't
  	        // accidentally pass it on to the delegate.
  	        this.arg = undefined$1;
  	      }

  	      return ContinueSentinel;
  	    }
  	  };

  	  // Regardless of whether this script is executing as a CommonJS module
  	  // or not, return the runtime object so that we can declare the variable
  	  // regeneratorRuntime in the outer scope, which allows this module to be
  	  // injected easily by `bin/regenerator --include-runtime script.js`.
  	  return exports;

  	}(
  	  // If this script is executing as a CommonJS module, use module.exports
  	  // as the regeneratorRuntime namespace. Otherwise create a new empty
  	  // object. Either way, the resulting object will be used to initialize
  	  // the regeneratorRuntime variable at the top of this file.
  	  module.exports 
  	));

  	try {
  	  regeneratorRuntime = runtime;
  	} catch (accidentalStrictMode) {
  	  // This module should not be running in strict mode, so the above
  	  // assignment should always work unless something is misconfigured. Just
  	  // in case runtime.js accidentally runs in strict mode, in modern engines
  	  // we can explicitly access globalThis. In older engines we can escape
  	  // strict mode using a global Function call. This could conceivably fail
  	  // if a Content Security Policy forbids using Function, but in that case
  	  // the proper solution is to fix the accidental strict mode problem. If
  	  // you've misconfigured your bundler to force strict mode and applied a
  	  // CSP to forbid Function, and you're not willing to fix either of those
  	  // problems, please detail your unique predicament in a GitHub issue.
  	  if (typeof globalThis === "object") {
  	    globalThis.regeneratorRuntime = runtime;
  	  } else {
  	    Function("r", "regeneratorRuntime = r")(runtime);
  	  }
  	} 
  } (runtime));

  var getId$3 = (prefix, cnt) => (
    `${prefix}-${cnt}-${Math.random().toString(16).slice(3, 8)}`
  );

  const getId$2 = getId$3;

  let jobCounter = 0;

  var createJob$2 = ({
    id: _id,
    action,
    payload = {},
  }) => {
    let id = _id;
    if (typeof id === 'undefined') {
      id = getId$2('Job', jobCounter);
      jobCounter += 1;
    }

    return {
      id,
      action,
      payload,
    };
  };

  var log$2 = {};

  let logging = false;

  log$2.logging = logging;

  log$2.setLogging = (_logging) => {
    logging = _logging;
  };

  log$2.log = (...args) => (logging ? console.log.apply(exports, args) : null);

  const createJob$1 = createJob$2;
  const { log: log$1 } = log$2;
  const getId$1 = getId$3;

  let schedulerCounter = 0;

  var createScheduler$1 = () => {
    const id = getId$1('Scheduler', schedulerCounter);
    const workers = {};
    const runningWorkers = {};
    let jobQueue = [];

    schedulerCounter += 1;

    const getQueueLen = () => jobQueue.length;
    const getNumWorkers = () => Object.keys(workers).length;

    const dequeue = () => {
      if (jobQueue.length !== 0) {
        const wIds = Object.keys(workers);
        for (let i = 0; i < wIds.length; i += 1) {
          if (typeof runningWorkers[wIds[i]] === 'undefined') {
            jobQueue[0](workers[wIds[i]]);
            break;
          }
        }
      }
    };

    const queue = (action, payload) => (
      new Promise((resolve, reject) => {
        const job = createJob$1({ action, payload });
        jobQueue.push(async (w) => {
          jobQueue.shift();
          runningWorkers[w.id] = job;
          try {
            resolve(await w[action].apply(exports, [...payload, job.id]));
          } catch (err) {
            reject(err);
          } finally {
            delete runningWorkers[w.id];
            dequeue();
          }
        });
        log$1(`[${id}]: Add ${job.id} to JobQueue`);
        log$1(`[${id}]: JobQueue length=${jobQueue.length}`);
        dequeue();
      })
    );

    const addWorker = (w) => {
      workers[w.id] = w;
      log$1(`[${id}]: Add ${w.id}`);
      log$1(`[${id}]: Number of workers=${getNumWorkers()}`);
      dequeue();
      return w.id;
    };

    const addJob = async (action, ...payload) => {
      if (getNumWorkers() === 0) {
        throw Error(`[${id}]: You need to have at least one worker before adding jobs`);
      }
      return queue(action, payload);
    };

    const terminate = async () => {
      Object.keys(workers).forEach(async (wid) => {
        await workers[wid].terminate();
      });
      jobQueue = [];
    };

    return {
      addWorker,
      addJob,
      terminate,
      getQueueLen,
      getNumWorkers,
    };
  };

  var global$1 = (typeof global !== "undefined" ? global :
    typeof self !== "undefined" ? self :
    typeof window !== "undefined" ? window : {});

  // shim for using process in browser
  // based off https://github.com/defunctzombie/node-process/blob/master/browser.js

  function defaultSetTimout() {
      throw new Error('setTimeout has not been defined');
  }
  function defaultClearTimeout () {
      throw new Error('clearTimeout has not been defined');
  }
  var cachedSetTimeout = defaultSetTimout;
  var cachedClearTimeout = defaultClearTimeout;
  if (typeof global$1.setTimeout === 'function') {
      cachedSetTimeout = setTimeout;
  }
  if (typeof global$1.clearTimeout === 'function') {
      cachedClearTimeout = clearTimeout;
  }

  function runTimeout(fun) {
      if (cachedSetTimeout === setTimeout) {
          //normal enviroments in sane situations
          return setTimeout(fun, 0);
      }
      // if setTimeout wasn't available but was latter defined
      if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
          cachedSetTimeout = setTimeout;
          return setTimeout(fun, 0);
      }
      try {
          // when when somebody has screwed with setTimeout but no I.E. maddness
          return cachedSetTimeout(fun, 0);
      } catch(e){
          try {
              // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
              return cachedSetTimeout.call(null, fun, 0);
          } catch(e){
              // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
              return cachedSetTimeout.call(this, fun, 0);
          }
      }


  }
  function runClearTimeout(marker) {
      if (cachedClearTimeout === clearTimeout) {
          //normal enviroments in sane situations
          return clearTimeout(marker);
      }
      // if clearTimeout wasn't available but was latter defined
      if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
          cachedClearTimeout = clearTimeout;
          return clearTimeout(marker);
      }
      try {
          // when when somebody has screwed with setTimeout but no I.E. maddness
          return cachedClearTimeout(marker);
      } catch (e){
          try {
              // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
              return cachedClearTimeout.call(null, marker);
          } catch (e){
              // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
              // Some versions of I.E. have different rules for clearTimeout vs setTimeout
              return cachedClearTimeout.call(this, marker);
          }
      }



  }
  var queue = [];
  var draining = false;
  var currentQueue;
  var queueIndex = -1;

  function cleanUpNextTick() {
      if (!draining || !currentQueue) {
          return;
      }
      draining = false;
      if (currentQueue.length) {
          queue = currentQueue.concat(queue);
      } else {
          queueIndex = -1;
      }
      if (queue.length) {
          drainQueue();
      }
  }

  function drainQueue() {
      if (draining) {
          return;
      }
      var timeout = runTimeout(cleanUpNextTick);
      draining = true;

      var len = queue.length;
      while(len) {
          currentQueue = queue;
          queue = [];
          while (++queueIndex < len) {
              if (currentQueue) {
                  currentQueue[queueIndex].run();
              }
          }
          queueIndex = -1;
          len = queue.length;
      }
      currentQueue = null;
      draining = false;
      runClearTimeout(timeout);
  }
  function nextTick(fun) {
      var args = new Array(arguments.length - 1);
      if (arguments.length > 1) {
          for (var i = 1; i < arguments.length; i++) {
              args[i - 1] = arguments[i];
          }
      }
      queue.push(new Item(fun, args));
      if (queue.length === 1 && !draining) {
          runTimeout(drainQueue);
      }
  }
  // v8 likes predictible objects
  function Item(fun, array) {
      this.fun = fun;
      this.array = array;
  }
  Item.prototype.run = function () {
      this.fun.apply(null, this.array);
  };
  var title = 'browser';
  var platform = 'browser';
  var browser$2 = true;
  var env = {};
  var argv = [];
  var version$2 = ''; // empty string to avoid regexp issues
  var versions = {};
  var release = {};
  var config = {};

  function noop() {}

  var on = noop;
  var addListener = noop;
  var once = noop;
  var off = noop;
  var removeListener = noop;
  var removeAllListeners = noop;
  var emit = noop;

  function binding(name) {
      throw new Error('process.binding is not supported');
  }

  function cwd () { return '/' }
  function chdir (dir) {
      throw new Error('process.chdir is not supported');
  }function umask() { return 0; }

  // from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
  var performance = global$1.performance || {};
  var performanceNow =
    performance.now        ||
    performance.mozNow     ||
    performance.msNow      ||
    performance.oNow       ||
    performance.webkitNow  ||
    function(){ return (new Date()).getTime() };

  // generate timestamp or delta
  // see http://nodejs.org/api/process.html#process_process_hrtime
  function hrtime(previousTimestamp){
    var clocktime = performanceNow.call(performance)*1e-3;
    var seconds = Math.floor(clocktime);
    var nanoseconds = Math.floor((clocktime%1)*1e9);
    if (previousTimestamp) {
      seconds = seconds - previousTimestamp[0];
      nanoseconds = nanoseconds - previousTimestamp[1];
      if (nanoseconds<0) {
        seconds--;
        nanoseconds += 1e9;
      }
    }
    return [seconds,nanoseconds]
  }

  var startTime = new Date();
  function uptime() {
    var currentTime = new Date();
    var dif = currentTime - startTime;
    return dif / 1000;
  }

  var browser$1$1 = {
    nextTick: nextTick,
    title: title,
    browser: browser$2,
    env: env,
    argv: argv,
    version: version$2,
    versions: versions,
    on: on,
    addListener: addListener,
    once: once,
    off: off,
    removeListener: removeListener,
    removeAllListeners: removeAllListeners,
    emit: emit,
    binding: binding,
    cwd: cwd,
    chdir: chdir,
    umask: umask,
    hrtime: hrtime,
    platform: platform,
    release: release,
    config: config,
    uptime: uptime
  };

  function commonjsRequire(path) {
  	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
  }

  // https://github.com/electron/electron/issues/2288
  function isElectron$1() {
      // Renderer process
      if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
          return true;
      }

      // Main process
      if (typeof browser$1$1 !== 'undefined' && typeof browser$1$1.versions === 'object' && !!browser$1$1.versions.electron) {
          return true;
      }

      // Detect the user agent when the `nodeIntegration` option is set to false
      if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
          return true;
      }

      return false;
  }

  var isElectron_1 = isElectron$1;

  const isElectron = isElectron_1;

  var getEnvironment = (key) => {
    const env = {};

    if (typeof WorkerGlobalScope !== 'undefined') {
      env.type = 'webworker';
    } else if (isElectron()) {
      env.type = 'electron';
    } else if (typeof document === 'object') {
      env.type = 'browser';
    } else if (typeof browser$1$1 === 'object' && typeof commonjsRequire === 'function') {
      env.type = 'node';
    }

    if (typeof key === 'undefined') {
      return env;
    }

    return env[key];
  };

  const isBrowser = getEnvironment('type') === 'browser';

  const resolveURL = isBrowser ? s => (new URL(s, window.location.href)).href : s => s; // eslint-disable-line

  var resolvePaths$1 = (options) => {
    const opts = { ...options };
    ['corePath', 'workerPath', 'langPath'].forEach((key) => {
      if (options[key]) {
        opts[key] = resolveURL(opts[key]);
      }
    });
    return opts;
  };

  /**
   * In the recognition result of tesseract, there
   * is a deep JSON object for details, it has around
   *
   * The result of dump.js is a big JSON tree
   * which can be easily serialized (for instance
   * to be sent from a webworker to the main app
   * or through Node's IPC), but we want
   * a (circular) DOM-like interface for walking
   * through the data.
   *
   * @fileoverview DOM-like interface for walking through data
   * @author Kevin Kwok <antimatter15@gmail.com>
   * @author Guillermo Webster <gui@mit.edu>
   * @author Jerome Wu <jeromewus@gmail.com>
   */

  var circularize$1 = (page) => {
    const blocks = [];
    const paragraphs = [];
    const lines = [];
    const words = [];
    const symbols = [];

    if (page.blocks) {
      page.blocks.forEach((block) => {
        block.paragraphs.forEach((paragraph) => {
          paragraph.lines.forEach((line) => {
            line.words.forEach((word) => {
              word.symbols.forEach((sym) => {
                symbols.push({
                  ...sym, page, block, paragraph, line, word,
                });
              });
              words.push({
                ...word, page, block, paragraph, line,
              });
            });
            lines.push({
              ...line, page, block, paragraph,
            });
          });
          paragraphs.push({
            ...paragraph, page, block,
          });
        });
        blocks.push({
          ...block, page,
        });
      });
    }

    return {
      ...page, blocks, paragraphs, lines, words, symbols,
    };
  };

  /*
   * OEM = OCR Engine Mode, and there are 4 possible modes.
   *
   * By default tesseract.js uses LSTM_ONLY mode.
   *
   */

  var OEM$2 = {
    TESSERACT_ONLY: 0,
    LSTM_ONLY: 1,
    TESSERACT_LSTM_COMBINED: 2,
    DEFAULT: 3,
  };

  var name = "tesseract.js";
  var version$1 = "5.0.2";
  var description = "Pure Javascript Multilingual OCR";
  var main = "src/index.js";
  var types = "src/index.d.ts";
  var unpkg = "dist/tesseract.min.js";
  var jsdelivr = "dist/tesseract.min.js";
  var scripts = {
  	start: "node scripts/server.js",
  	build: "rimraf dist && webpack --config scripts/webpack.config.prod.js && rollup -c scripts/rollup.esm.mjs",
  	"profile:tesseract": "webpack-bundle-analyzer dist/tesseract-stats.json",
  	"profile:worker": "webpack-bundle-analyzer dist/worker-stats.json",
  	prepublishOnly: "npm run build",
  	wait: "rimraf dist && wait-on http://localhost:3000/dist/tesseract.min.js",
  	test: "npm-run-all -p -r start test:all",
  	"test:all": "npm-run-all wait test:browser:* test:node:all",
  	"test:node": "nyc mocha --exit --bail --require ./scripts/test-helper.js",
  	"test:node:all": "npm run test:node -- ./tests/*.test.js",
  	"test:browser-tpl": "mocha-headless-chrome -a incognito -a no-sandbox -a disable-setuid-sandbox -a disable-logging -t 300000",
  	"test:browser:detect": "npm run test:browser-tpl -- -f ./tests/detect.test.html",
  	"test:browser:recognize": "npm run test:browser-tpl -- -f ./tests/recognize.test.html",
  	"test:browser:scheduler": "npm run test:browser-tpl -- -f ./tests/scheduler.test.html",
  	"test:browser:FS": "npm run test:browser-tpl -- -f ./tests/FS.test.html",
  	lint: "eslint src",
  	"lint:fix": "eslint --fix src",
  	postinstall: "opencollective-postinstall || true"
  };
  var browser$1 = {
  	"./src/worker/node/index.js": "./src/worker/browser/index.js"
  };
  var author = "";
  var contributors = [
  	"jeromewu"
  ];
  var license = "Apache-2.0";
  var devDependencies = {
  	"@babel/core": "^7.21.4",
  	"@babel/eslint-parser": "^7.21.3",
  	"@babel/preset-env": "^7.21.4",
  	"@rollup/plugin-commonjs": "^24.1.0",
  	acorn: "^8.8.2",
  	"babel-loader": "^9.1.2",
  	buffer: "^6.0.3",
  	cors: "^2.8.5",
  	eslint: "^7.32.0",
  	"eslint-config-airbnb-base": "^14.2.1",
  	"eslint-plugin-import": "^2.27.5",
  	"expect.js": "^0.3.1",
  	express: "^4.18.2",
  	mocha: "^10.2.0",
  	"mocha-headless-chrome": "^4.0.0",
  	"npm-run-all": "^4.1.5",
  	nyc: "^15.1.0",
  	rimraf: "^5.0.0",
  	rollup: "^3.20.7",
  	"wait-on": "^7.0.1",
  	webpack: "^5.79.0",
  	"webpack-bundle-analyzer": "^4.8.0",
  	"webpack-cli": "^5.0.1",
  	"webpack-dev-middleware": "^6.0.2",
  	"rollup-plugin-sourcemaps": "^0.6.3"
  };
  var dependencies = {
  	"bmp-js": "^0.1.0",
  	"idb-keyval": "^6.2.0",
  	"is-electron": "^2.2.2",
  	"is-url": "^1.2.4",
  	"node-fetch": "^2.6.9",
  	"opencollective-postinstall": "^2.0.3",
  	"regenerator-runtime": "^0.13.3",
  	"tesseract.js-core": "^5.0.0",
  	"wasm-feature-detect": "^1.2.11",
  	zlibjs: "^0.3.1"
  };
  var overrides = {
  	"@rollup/pluginutils": "^5.0.2"
  };
  var repository = {
  	type: "git",
  	url: "https://github.com/naptha/tesseract.js.git"
  };
  var bugs = {
  	url: "https://github.com/naptha/tesseract.js/issues"
  };
  var homepage = "https://github.com/naptha/tesseract.js";
  var collective = {
  	type: "opencollective",
  	url: "https://opencollective.com/tesseractjs"
  };
  var require$$0 = {
  	name: name,
  	version: version$1,
  	description: description,
  	main: main,
  	types: types,
  	unpkg: unpkg,
  	jsdelivr: jsdelivr,
  	scripts: scripts,
  	browser: browser$1,
  	author: author,
  	contributors: contributors,
  	license: license,
  	devDependencies: devDependencies,
  	dependencies: dependencies,
  	overrides: overrides,
  	repository: repository,
  	bugs: bugs,
  	homepage: homepage,
  	collective: collective
  };

  var defaultOptions$3 = {
    /*
     * Use BlobURL for worker script by default
     * TODO: remove this option
     *
     */
    workerBlobURL: true,
    logger: () => {},
  };

  const { version } = require$$0;
  const defaultOptions$2 = defaultOptions$3;

  /*
   * Default options for browser worker
   */
  var defaultOptions_1 = {
    ...defaultOptions$2,
    workerPath: `https://cdn.jsdelivr.net/npm/tesseract.js@v${version}/dist/worker.min.js`,
  };

  /**
   * spawnWorker
   *
   * @name spawnWorker
   * @function create a new Worker in browser
   * @access public
   */

  var spawnWorker$2 = ({ workerPath, workerBlobURL }) => {
    let worker;
    if (Blob && URL && workerBlobURL) {
      const blob = new Blob([`importScripts("${workerPath}");`], {
        type: 'application/javascript',
      });
      worker = new Worker(URL.createObjectURL(blob));
    } else {
      worker = new Worker(workerPath);
    }

    return worker;
  };

  /**
   * terminateWorker
   *
   * @name terminateWorker
   * @function terminate worker
   * @access public
   */

  var terminateWorker$2 = (worker) => {
    worker.terminate();
  };

  var onMessage$2 = (worker, handler) => {
    worker.onmessage = ({ data }) => { // eslint-disable-line
      handler(data);
    };
  };

  /**
   * send
   *
   * @name send
   * @function send packet to worker and create a job
   * @access public
   */

  var send$2 = async (worker, packet) => {
    worker.postMessage(packet);
  };

  /**
   * readFromBlobOrFile
   *
   * @name readFromBlobOrFile
   * @function
   * @access private
   */

  const readFromBlobOrFile = (blob) => (
    new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        resolve(fileReader.result);
      };
      fileReader.onerror = ({ target: { error: { code } } }) => {
        reject(Error(`File could not be read! Code=${code}`));
      };
      fileReader.readAsArrayBuffer(blob);
    })
  );

  /**
   * loadImage
   *
   * @name loadImage
   * @function load image from different source
   * @access private
   */
  const loadImage$2 = async (image) => {
    let data = image;
    if (typeof image === 'undefined') {
      return 'undefined';
    }

    if (typeof image === 'string') {
      // Base64 Image
      if (/data:image\/([a-zA-Z]*);base64,([^"]*)/.test(image)) {
        data = atob(image.split(',')[1])
          .split('')
          .map((c) => c.charCodeAt(0));
      } else {
        const resp = await fetch(image);
        data = await resp.arrayBuffer();
      }
    } else if (typeof HTMLElement !== 'undefined' && image instanceof HTMLElement) {
      if (image.tagName === 'IMG') {
        data = await loadImage$2(image.src);
      }
      if (image.tagName === 'VIDEO') {
        data = await loadImage$2(image.poster);
      }
      if (image.tagName === 'CANVAS') {
        await new Promise((resolve) => {
          image.toBlob(async (blob) => {
            data = await readFromBlobOrFile(blob);
            resolve();
          });
        });
      }
    } else if (typeof OffscreenCanvas !== 'undefined' && image instanceof OffscreenCanvas) {
      const blob = await image.convertToBlob();
      data = await readFromBlobOrFile(blob);
    } else if (image instanceof File || image instanceof Blob) {
      data = await readFromBlobOrFile(image);
    }

    return new Uint8Array(data);
  };

  var loadImage_1 = loadImage$2;

  /**
   *
   * Tesseract Worker adapter for browser
   *
   * @fileoverview Tesseract Worker adapter for browser
   * @author Kevin Kwok <antimatter15@gmail.com>
   * @author Guillermo Webster <gui@mit.edu>
   * @author Jerome Wu <jeromewus@gmail.com>
   */

  const defaultOptions$1 = defaultOptions_1;
  const spawnWorker$1 = spawnWorker$2;
  const terminateWorker$1 = terminateWorker$2;
  const onMessage$1 = onMessage$2;
  const send$1 = send$2;
  const loadImage$1 = loadImage_1;

  var browser = {
    defaultOptions: defaultOptions$1,
    spawnWorker: spawnWorker$1,
    terminateWorker: terminateWorker$1,
    onMessage: onMessage$1,
    send: send$1,
    loadImage: loadImage$1,
  };

  const resolvePaths = resolvePaths$1;
  const circularize = circularize$1;
  const createJob = createJob$2;
  const { log } = log$2;
  const getId = getId$3;
  const OEM$1 = OEM$2;
  const {
    defaultOptions,
    spawnWorker,
    terminateWorker,
    onMessage,
    loadImage,
    send,
  } = browser;

  let workerCounter = 0;

  var createWorker$2 = async (langs = 'eng', oem = OEM$1.LSTM_ONLY, _options = {}, config = {}) => {
    const id = getId('Worker', workerCounter);
    const {
      logger,
      errorHandler,
      ...options
    } = resolvePaths({
      ...defaultOptions,
      ..._options,
    });
    const resolves = {};
    const rejects = {};

    // Current langs, oem, and config file.
    // Used if the user ever re-initializes the worker using `worker.reinitialize`.
    const currentLangs = typeof langs === 'string' ? langs.split('+') : langs;
    let currentOem = oem;
    let currentConfig = config;
    const lstmOnlyCore = [OEM$1.DEFAULT, OEM$1.LSTM_ONLY].includes(oem) && !options.legacyCore;

    let workerResReject;
    let workerResResolve;
    const workerRes = new Promise((resolve, reject) => {
      workerResResolve = resolve;
      workerResReject = reject;
    });
    const workerError = (event) => { workerResReject(event.message); };

    let worker = spawnWorker(options);
    worker.onerror = workerError;

    workerCounter += 1;

    const setResolve = (action, res) => {
      resolves[action] = res;
    };

    const setReject = (action, rej) => {
      rejects[action] = rej;
    };

    const startJob = ({ id: jobId, action, payload }) => (
      new Promise((resolve, reject) => {
        log(`[${id}]: Start ${jobId}, action=${action}`);
        setResolve(action, resolve);
        setReject(action, reject);
        send(worker, {
          workerId: id,
          jobId,
          action,
          payload,
        });
      })
    );

    const load = () => (
      console.warn('`load` is depreciated and should be removed from code (workers now come pre-loaded)')
    );

    const loadInternal = (jobId) => (
      startJob(createJob({
        id: jobId, action: 'load', payload: { options: { lstmOnly: lstmOnlyCore, corePath: options.corePath, logging: options.logging } },
      }))
    );

    const writeText = (path, text, jobId) => (
      startJob(createJob({
        id: jobId,
        action: 'FS',
        payload: { method: 'writeFile', args: [path, text] },
      }))
    );

    const readText = (path, jobId) => (
      startJob(createJob({
        id: jobId,
        action: 'FS',
        payload: { method: 'readFile', args: [path, { encoding: 'utf8' }] },
      }))
    );

    const removeFile = (path, jobId) => (
      startJob(createJob({
        id: jobId,
        action: 'FS',
        payload: { method: 'unlink', args: [path] },
      }))
    );

    const FS = (method, args, jobId) => (
      startJob(createJob({
        id: jobId,
        action: 'FS',
        payload: { method, args },
      }))
    );

    const loadLanguage = () => (
      console.warn('`loadLanguage` is depreciated and should be removed from code (workers now come with language pre-loaded)')
    );

    const loadLanguageInternal = (_langs, jobId) => startJob(createJob({
      id: jobId,
      action: 'loadLanguage',
      payload: {
        langs: _langs,
        options: {
          langPath: options.langPath,
          dataPath: options.dataPath,
          cachePath: options.cachePath,
          cacheMethod: options.cacheMethod,
          gzip: options.gzip,
          lstmOnly: [OEM$1.LSTM_ONLY, OEM$1.TESSERACT_LSTM_COMBINED].includes(currentOem)
            && !options.legacyLang,
        },
      },
    }));

    const initialize = () => (
      console.warn('`initialize` is depreciated and should be removed from code (workers now come pre-initialized)')
    );

    const initializeInternal = (_langs, _oem, _config, jobId) => (
      startJob(createJob({
        id: jobId,
        action: 'initialize',
        payload: { langs: _langs, oem: _oem, config: _config },
      }))
    );

    const reinitialize = (langs = 'eng', oem, config, jobId) => { // eslint-disable-line

      if (lstmOnlyCore && [OEM$1.TESSERACT_ONLY, OEM$1.TESSERACT_LSTM_COMBINED].includes(oem)) throw Error('Legacy model requested but code missing.');

      const _oem = oem || currentOem;
      currentOem = _oem;

      const _config = config || currentConfig;
      currentConfig = _config;

      // Only load langs that are not already loaded.
      // This logic fails if the user downloaded the LSTM-only English data for a language
      // and then uses `worker.reinitialize` to switch to the Legacy engine.
      // However, the correct data will still be downloaded after initialization fails
      // and this can be avoided entirely if the user loads the correct data ahead of time.
      const langsArr = typeof langs === 'string' ? langs.split('+') : langs;
      const _langs = langsArr.filter((x) => !currentLangs.includes(x));
      currentLangs.push(..._langs);

      if (_langs.length > 0) {
        return loadLanguageInternal(_langs, jobId)
          .then(() => initializeInternal(langs, _oem, _config, jobId));
      }

      return initializeInternal(langs, _oem, _config, jobId);
    };

    const setParameters = (params = {}, jobId) => (
      startJob(createJob({
        id: jobId,
        action: 'setParameters',
        payload: { params },
      }))
    );

    const recognize = async (image, opts = {}, output = {
      blocks: true, text: true, hocr: true, tsv: true,
    }, jobId) => (
      startJob(createJob({
        id: jobId,
        action: 'recognize',
        payload: { image: await loadImage(image), options: opts, output },
      }))
    );

    const getPDF = (title = 'Tesseract OCR Result', textonly = false, jobId) => {
      console.log('`getPDF` function is depreciated. `recognize` option `savePDF` should be used instead.');
      return startJob(createJob({
        id: jobId,
        action: 'getPDF',
        payload: { title, textonly },
      }));
    };

    const detect = async (image, jobId) => {
      if (lstmOnlyCore) throw Error('`worker.detect` requires Legacy model, which was not loaded.');

      return startJob(createJob({
        id: jobId,
        action: 'detect',
        payload: { image: await loadImage(image) },
      }));
    };

    const terminate = async () => {
      if (worker !== null) {
        /*
        await startJob(createJob({
          id: jobId,
          action: 'terminate',
        }));
        */
        terminateWorker(worker);
        worker = null;
      }
      return Promise.resolve();
    };

    onMessage(worker, ({
      workerId, jobId, status, action, data,
    }) => {
      if (status === 'resolve') {
        log(`[${workerId}]: Complete ${jobId}`);
        let d = data;
        if (action === 'recognize') {
          d = circularize(data);
        } else if (action === 'getPDF') {
          d = Array.from({ ...data, length: Object.keys(data).length });
        }
        resolves[action]({ jobId, data: d });
      } else if (status === 'reject') {
        rejects[action](data);
        if (action === 'load') workerResReject(data);
        if (errorHandler) {
          errorHandler(data);
        } else {
          throw Error(data);
        }
      } else if (status === 'progress') {
        logger({ ...data, userJobId: jobId });
      }
    });

    const resolveObj = {
      id,
      worker,
      setResolve,
      setReject,
      load,
      writeText,
      readText,
      removeFile,
      FS,
      loadLanguage,
      initialize,
      reinitialize,
      setParameters,
      recognize,
      getPDF,
      detect,
      terminate,
    };

    loadInternal()
      .then(() => loadLanguageInternal(langs))
      .then(() => initializeInternal(langs, oem, config))
      .then(() => workerResResolve(resolveObj))
      .catch(() => {});

    return workerRes;
  };

  const createWorker$1 = createWorker$2;

  const recognize = async (image, langs, options) => {
    const worker = await createWorker$1(langs, 1, options);
    return worker.recognize(image)
      .finally(async () => {
        await worker.terminate();
      });
  };

  const detect = async (image, options) => {
    const worker = await createWorker$1('osd', 0, options);
    return worker.detect(image)
      .finally(async () => {
        await worker.terminate();
      });
  };

  var Tesseract$1 = {
    recognize,
    detect,
  };

  /*
   * languages with existing tesseract traineddata
   * https://tesseract-ocr.github.io/tessdoc/Data-Files#data-files-for-version-400-november-29-2016
   */

  /**
   * @typedef {object} Languages
   * @property {string} AFR Afrikaans
   * @property {string} AMH Amharic
   * @property {string} ARA Arabic
   * @property {string} ASM Assamese
   * @property {string} AZE Azerbaijani
   * @property {string} AZE_CYRL Azerbaijani - Cyrillic
   * @property {string} BEL Belarusian
   * @property {string} BEN Bengali
   * @property {string} BOD Tibetan
   * @property {string} BOS Bosnian
   * @property {string} BUL Bulgarian
   * @property {string} CAT Catalan; Valencian
   * @property {string} CEB Cebuano
   * @property {string} CES Czech
   * @property {string} CHI_SIM Chinese - Simplified
   * @property {string} CHI_TRA Chinese - Traditional
   * @property {string} CHR Cherokee
   * @property {string} CYM Welsh
   * @property {string} DAN Danish
   * @property {string} DEU German
   * @property {string} DZO Dzongkha
   * @property {string} ELL Greek, Modern (1453-)
   * @property {string} ENG English
   * @property {string} ENM English, Middle (1100-1500)
   * @property {string} EPO Esperanto
   * @property {string} EST Estonian
   * @property {string} EUS Basque
   * @property {string} FAS Persian
   * @property {string} FIN Finnish
   * @property {string} FRA French
   * @property {string} FRK German Fraktur
   * @property {string} FRM French, Middle (ca. 1400-1600)
   * @property {string} GLE Irish
   * @property {string} GLG Galician
   * @property {string} GRC Greek, Ancient (-1453)
   * @property {string} GUJ Gujarati
   * @property {string} HAT Haitian; Haitian Creole
   * @property {string} HEB Hebrew
   * @property {string} HIN Hindi
   * @property {string} HRV Croatian
   * @property {string} HUN Hungarian
   * @property {string} IKU Inuktitut
   * @property {string} IND Indonesian
   * @property {string} ISL Icelandic
   * @property {string} ITA Italian
   * @property {string} ITA_OLD Italian - Old
   * @property {string} JAV Javanese
   * @property {string} JPN Japanese
   * @property {string} KAN Kannada
   * @property {string} KAT Georgian
   * @property {string} KAT_OLD Georgian - Old
   * @property {string} KAZ Kazakh
   * @property {string} KHM Central Khmer
   * @property {string} KIR Kirghiz; Kyrgyz
   * @property {string} KOR Korean
   * @property {string} KUR Kurdish
   * @property {string} LAO Lao
   * @property {string} LAT Latin
   * @property {string} LAV Latvian
   * @property {string} LIT Lithuanian
   * @property {string} MAL Malayalam
   * @property {string} MAR Marathi
   * @property {string} MKD Macedonian
   * @property {string} MLT Maltese
   * @property {string} MSA Malay
   * @property {string} MYA Burmese
   * @property {string} NEP Nepali
   * @property {string} NLD Dutch; Flemish
   * @property {string} NOR Norwegian
   * @property {string} ORI Oriya
   * @property {string} PAN Panjabi; Punjabi
   * @property {string} POL Polish
   * @property {string} POR Portuguese
   * @property {string} PUS Pushto; Pashto
   * @property {string} RON Romanian; Moldavian; Moldovan
   * @property {string} RUS Russian
   * @property {string} SAN Sanskrit
   * @property {string} SIN Sinhala; Sinhalese
   * @property {string} SLK Slovak
   * @property {string} SLV Slovenian
   * @property {string} SPA Spanish; Castilian
   * @property {string} SPA_OLD Spanish; Castilian - Old
   * @property {string} SQI Albanian
   * @property {string} SRP Serbian
   * @property {string} SRP_LATN Serbian - Latin
   * @property {string} SWA Swahili
   * @property {string} SWE Swedish
   * @property {string} SYR Syriac
   * @property {string} TAM Tamil
   * @property {string} TEL Telugu
   * @property {string} TGK Tajik
   * @property {string} TGL Tagalog
   * @property {string} THA Thai
   * @property {string} TIR Tigrinya
   * @property {string} TUR Turkish
   * @property {string} UIG Uighur; Uyghur
   * @property {string} UKR Ukrainian
   * @property {string} URD Urdu
   * @property {string} UZB Uzbek
   * @property {string} UZB_CYRL Uzbek - Cyrillic
   * @property {string} VIE Vietnamese
   * @property {string} YID Yiddish
   */

  /**
    * @type {Languages}
    */
  var languages$1 = {
    AFR: 'afr',
    AMH: 'amh',
    ARA: 'ara',
    ASM: 'asm',
    AZE: 'aze',
    AZE_CYRL: 'aze_cyrl',
    BEL: 'bel',
    BEN: 'ben',
    BOD: 'bod',
    BOS: 'bos',
    BUL: 'bul',
    CAT: 'cat',
    CEB: 'ceb',
    CES: 'ces',
    CHI_SIM: 'chi_sim',
    CHI_TRA: 'chi_tra',
    CHR: 'chr',
    CYM: 'cym',
    DAN: 'dan',
    DEU: 'deu',
    DZO: 'dzo',
    ELL: 'ell',
    ENG: 'eng',
    ENM: 'enm',
    EPO: 'epo',
    EST: 'est',
    EUS: 'eus',
    FAS: 'fas',
    FIN: 'fin',
    FRA: 'fra',
    FRK: 'frk',
    FRM: 'frm',
    GLE: 'gle',
    GLG: 'glg',
    GRC: 'grc',
    GUJ: 'guj',
    HAT: 'hat',
    HEB: 'heb',
    HIN: 'hin',
    HRV: 'hrv',
    HUN: 'hun',
    IKU: 'iku',
    IND: 'ind',
    ISL: 'isl',
    ITA: 'ita',
    ITA_OLD: 'ita_old',
    JAV: 'jav',
    JPN: 'jpn',
    KAN: 'kan',
    KAT: 'kat',
    KAT_OLD: 'kat_old',
    KAZ: 'kaz',
    KHM: 'khm',
    KIR: 'kir',
    KOR: 'kor',
    KUR: 'kur',
    LAO: 'lao',
    LAT: 'lat',
    LAV: 'lav',
    LIT: 'lit',
    MAL: 'mal',
    MAR: 'mar',
    MKD: 'mkd',
    MLT: 'mlt',
    MSA: 'msa',
    MYA: 'mya',
    NEP: 'nep',
    NLD: 'nld',
    NOR: 'nor',
    ORI: 'ori',
    PAN: 'pan',
    POL: 'pol',
    POR: 'por',
    PUS: 'pus',
    RON: 'ron',
    RUS: 'rus',
    SAN: 'san',
    SIN: 'sin',
    SLK: 'slk',
    SLV: 'slv',
    SPA: 'spa',
    SPA_OLD: 'spa_old',
    SQI: 'sqi',
    SRP: 'srp',
    SRP_LATN: 'srp_latn',
    SWA: 'swa',
    SWE: 'swe',
    SYR: 'syr',
    TAM: 'tam',
    TEL: 'tel',
    TGK: 'tgk',
    TGL: 'tgl',
    THA: 'tha',
    TIR: 'tir',
    TUR: 'tur',
    UIG: 'uig',
    UKR: 'ukr',
    URD: 'urd',
    UZB: 'uzb',
    UZB_CYRL: 'uzb_cyrl',
    VIE: 'vie',
    YID: 'yid',
  };

  /*
   * PSM = Page Segmentation Mode
   */

  var PSM$1 = {
    OSD_ONLY: '0',
    AUTO_OSD: '1',
    AUTO_ONLY: '2',
    AUTO: '3',
    SINGLE_COLUMN: '4',
    SINGLE_BLOCK_VERT_TEXT: '5',
    SINGLE_BLOCK: '6',
    SINGLE_LINE: '7',
    SINGLE_WORD: '8',
    CIRCLE_WORD: '9',
    SINGLE_CHAR: '10',
    SPARSE_TEXT: '11',
    SPARSE_TEXT_OSD: '12',
    RAW_LINE: '13',
  };

  /**
   *
   * Entry point for tesseract.js, should be the entry when bundling.
   *
   * @fileoverview entry point for tesseract.js
   * @author Kevin Kwok <antimatter15@gmail.com>
   * @author Guillermo Webster <gui@mit.edu>
   * @author Jerome Wu <jeromewus@gmail.com>
   */

  const createScheduler = createScheduler$1;
  const createWorker = createWorker$2;
  const Tesseract = Tesseract$1;
  const languages = languages$1;
  const OEM = OEM$2;
  const PSM = PSM$1;
  const { setLogging } = log$2;

  var src = {
    languages,
    OEM,
    PSM,
    createScheduler,
    createWorker,
    setLogging,
    ...Tesseract,
  };

  try { Object.defineProperty(src, "__" + "esModule", { value: true }); } catch (ex) {}

  return src;

}));
