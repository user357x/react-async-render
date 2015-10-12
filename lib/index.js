/**
 * react-async-render
 * (c) 2015-2016 eBay Software Foundation
 * react-async-render may be freely distributed under the MIT license.
 */

'use strict';

var _require = require('./provider');

var Provider = _require.Provider;
var contextTypes = _require.contextTypes;

var React = require('react');

var _require2 = require('react-dom/server');

var renderToString = _require2.renderToString;

var store = require('./store');
var Q = require('kew');

exports.render = function (appComponent, appReducer) {
  var _store = store(appReducer || {});

  var allPromises;

  var onResolve = function onResolve(promises) {
    allPromises = promises;
  };

  var app = React.createElement(
    Provider,
    { store: _store, onResolve: onResolve },
    appComponent
  );

  var html = renderToString(app);
  if (allPromises) {
    return allPromises().then(function () {
      html = renderToString(app);
      return {
        store: _store,
        html: html
      };
    });
  } else {
    return Q.resolve({
      store: _store,
      html: html
    });
  }
};
exports.renderToString = function (appComponent, appReducer) {
  return exports.render(appComponent, appReducer).then(function (_ref) {
    var store = _ref.store;
    var html = _ref.html;

    return html;
  });
};

exports.contextTypes = contextTypes;
exports.mixin = require('./mixin');