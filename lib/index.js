/**
 * react-async-render
 * (c) 2015-2016 eBay Software Foundation
 * react-async-render may be freely distributed under the MIT license.
 */

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('./provider');

var Provider = _require.Provider;
var contextTypes = _require.contextTypes;
var Script = _require.Script;

var React = require('react');

var _require2 = require('react-dom/server');

var renderToStaticMarkup = _require2.renderToStaticMarkup;

var createStore = require('./store');
var Q = require('kew');

var InitScript = (function (_React$Component) {
  _inherits(InitScript, _React$Component);

  function InitScript() {
    _classCallCheck(this, InitScript);

    _get(Object.getPrototypeOf(InitScript.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(InitScript, [{
    key: 'render',
    value: function render() {
      var store = this.props.store;
      var initState = {};
      if (store && typeof store.getState == 'function') {
        initState = store.getState();
      }
      var body = "window.__INITIAL_STATE__ = " + JSON.stringify(initState);
      return React.createElement('script', { dangerouslySetInnerHTML: { __html: body } });
    }
  }]);

  return InitScript;
})(React.Component);

exports.render = function (appComponent, appReducer) {
  var store = createStore(appReducer || {});

  var allPromises;

  var onResolve = function onResolve(promises) {
    allPromises = promises;
  };

  var app = React.createElement(
    Provider,
    { store: store, onResolve: onResolve },
    appComponent
  );

  var html = renderToStaticMarkup(app);
  var script = '';
  if (allPromises) {
    return allPromises().then(function (results) {
      if (results && results.length) {
        html = renderToStaticMarkup(app);
      }
      var scriptTag = React.createElement(InitScript, { store: store });
      script = renderToStaticMarkup(scriptTag);
      return { store: store, script: script, html: html };
    });
  } else {
    return Q.resolve({ store: store, script: script, html: html });
  }
};
exports.renderToString = function (appComponent, appReducer) {
  return exports.render(appComponent, appReducer).then(function (_ref) {
    var store = _ref.store;
    var html = _ref.html;
    var script = _ref.script;

    return html;
  });
};

exports.contextTypes = contextTypes;
exports.mixin = require('./mixin');
exports.Provider = exports.AsyncProvider = Provider;
exports.store = exports.createStore = createStore;
exports.reducers = exports.initReducers = { initialize: require('./reducer') };