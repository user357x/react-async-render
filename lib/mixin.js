/**
 * react-async-render
 * (c) 2015-2016 eBay Software Foundation
 * react-async-render may be freely distributed under the MIT license.
 */

'use strict';

var Q = require('kew');

exports.asyncInit = function (func, initKey, avoidSetState) {
  var deferred = Q.defer();
  initKey = initKey || randomKey();
  if (this.context && this.context.asyncQ) {
    this.context.asyncQ.addToQueue(deferred.promise);
  }
  //DEFINE DONE and pass to func
  func.call(this, (function (err, data) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve({
        key: initKey,
        data: data
      });
      if (!avoidSetState) {
        try {
          this.setState(data);
        } catch (e) {}
      }
    }
  }).bind(this));
};

function randomKey() {
  var time = new Date().getTime();
  return 'key' + time % 10000;
}