var Promise = (function() {
  function Promise(callback) {
    if (typeof callback != 'function') {
      throw new TypeError('Promise resolver ' + callback + ' is not a function')
    }
    if (!(this instanceof Promise)) return new Promise(callback)

    var self = this
    self.callbacks = []
    self.status = 'pending'

    function resolve(value) {
      setTimeout(function(){
        if (self.status != 'pending') {
          return
        }
        self.status = 'resolved'
        self.data = value

        for (var i = 0; i < self.callbacks.length; i++) {
          self.callbacks[i].resolver(value)
        }
      })
    }

    function reject(reason) {
      setTimeout(function(){
        if (self.status != 'pending') {
          return
        }
        self.status = 'rejected'
        self.data = reason

        for (var i = 0; i < self.callbacks.length; i++) {
          self.callbacks[i].rejector(reason)
        }
      })
    }

    try{
      callback(resolve, reject)
    } catch(e) {
      reject(e)
    }
  }

  function noop(){}

  Promise.prototype.isPromise = true

  Promise.prototype.then = function(resolver, rejector) {
    resolver = typeof resolver === 'function' ? resolver : function(v){return v}
    rejector = typeof rejector === 'function' ? rejector : function(r){throw r}
    var self = this;

    if (self.status == 'resolved') {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          try {
            var value = resolver(self.data)
            if (value && value.isPromise) {
              return value.then(resolve, reject)
            } else {
              return resolve(value)
            }
          } catch(e) {
            //console.error('catch',e)
            return reject(e)
          }
        })
      })
    }

    if (self.status == 'rejected') {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          try {
            var value = rejector(self.data)
            if (value && value.isPromise) {
              return value.then(resolve, reject)
            } else {
              return resolve(value)
            }
          } catch(e) {
            //console.error('catch',e)
            return reject(e)
          }
        })
      })
    }

    if (self.status == 'pending') {
      return new Promise(function(resolve, reject) {
        self.callbacks.push({
          resolver: function(value) {
            try {
              var value = resolver(value)
              if (value && value.isPromise) {
                return value.then(resolve, reject)
              } else {
                return resolve(value)
              }
            } catch(e) {
              //console.error('catch',e)
              return reject(e)
            }
          },
          rejector: function(reason) {
            try {
              var value = rejector(reason)
              if (value && value.isPromise) {
                return value.then(resolve, reject)
              } else {
                return resolve(value)
              }
            } catch(e) {
              //console.error('catch',e)
              return reject(e)
            }
          }
        })
      })
    }
  }

  Promise.prototype.valueOf = function() {
    return this.data
  }

  Promise.prototype.catch = function(onRejected) {
    return this.then(null, onRejected);
  };

  Promise.prototype.delay = function(duration) {
    return this.then(function(value) {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          resolve(value)
        }, duration)
      })
    }, function(reason) {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          reject(reason)
        }, duration)
      })
    })
  }

  Promise.all = function(promises) {
    return new Promise(function(resolve, reject) {
      var resolvedCounter = 0;
      var promiseNum = promises.length;
      var resolvedValues = new Array(promiseNum);
      for (var i = 0; i < promiseNum; i++) {
        (function(i) {
          promises[i].then(function(value) {
            resolvedCounter++;
            resolvedValues[i] = value;
            if (resolvedCounter == promiseNum) {
              return resolve(resolvedValues);
            }
          }, function(reason) {
            return reject(reason)
          });
        })(i);
      }
    });
  };

  Promise.race = function(promises) {
    return new Promise(function(resolve, reject) {
      for (var i = 0; i < promises.length; i++) {
        promises[i].then(function(value) {
          return resolve(value);
        }, function(reason){
          return reject(reason)
        });
      }
    });
  };

  Promise.resolve = function(value) {
    return new Promise(function(resolve) {
      resolve(value)
    })
  }

  Promise.reject = function(reason) {
    return new Promise(function(resolve, reject) {
      reject(reason)
    })
  }

  Promise.fcall = function(fn){
    return Promise.resolve().then(fn)
  }

  Promise.done = function(){
    return new Promise(function(){})
  }

  Promise.deferred = Promise.defer = function() {
    var dfd = {}
    dfd.promise = new Promise(function(resolve, reject) {
      dfd.resolve = resolve
      dfd.reject = reject
    })
    return dfd
  }

  try {
    module.exports = Promise
  } catch(e) {

  }

  return Promise;
})()
