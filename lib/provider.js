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

var React = require('react');
var Q = require('kew');

var _require = require('react-redux');

var connect = _require.connect;
var Provider = _require.Provider;

var _require2 = require('./actions');

var init = _require2.init;

function Queue(initFunc) {
  var queue = [];
  var initAny = initFunc;
  this.addToQueue = function (promise) {
    queue.push(promise);
  };
  this.resetQueue = function () {
    queue = [];
  };
  this.resolveAll = function () {
    var p;
    if (queue.length) {
      p = Q.all(queue).then(function (results) {
        if (results && results.length) {
          var _results = results.slice(0);
          for (var i = 0, m = _results.length; i < m; i++) {
            var result = _results[i];
            if (typeof initAny == 'function') {
              initAny(result);
            }
          }
        }
        return results;
      }, function (err) {
        console.error('##### error:', err.stack);
      });
    } else {
      p = Q.fcall(function () {
        return [];
      });
    }
    return p;
  };
}

var InitProvider = (function (_React$Component) {
  _inherits(InitProvider, _React$Component);

  function InitProvider(props) {
    _classCallCheck(this, InitProvider);

    _get(Object.getPrototypeOf(InitProvider.prototype), 'constructor', this).call(this, props);
    this.state = {
      store: this.props.store || require('./store')()
    };
  }

  _createClass(InitProvider, [{
    key: 'getChildContext',
    value: function getChildContext() {
      return {
        asyncQ: new Queue(this.props.initAny)
      };
    }
  }, {
    key: 'render',
    value: function render() {
      return React.createElement(
        Provider,
        { store: this.state.store },
        React.createElement(
          InnerProvider,
          { onResolve: this.props.onResolve },
          this.props.children
        )
      );
    }
  }]);

  return InitProvider;
})(React.Component);

InitProvider.childContextTypes = {
  asyncQ: React.PropTypes.object
};

var InnerProvider = (function (_React$Component2) {
  _inherits(InnerProvider, _React$Component2);

  function InnerProvider(props) {
    _classCallCheck(this, InnerProvider);

    _get(Object.getPrototypeOf(InnerProvider.prototype), 'constructor', this).call(this, props);
  }

  _createClass(InnerProvider, [{
    key: 'render',
    value: function render() {
      this.context.asyncQ.resetQueue();
      if (typeof this.props.onResolve == 'function') {
        this.props.onResolve(this.context.asyncQ.resolveAll);
      }
      var children = this.props.children;

      if (typeof children === 'function') {
        return children();
      }
      return children;
    }
  }]);

  return InnerProvider;
})(React.Component);

InnerProvider.contextTypes = {
  asyncQ: React.PropTypes.object
};

function mapDispatchToProps(dispatch) {
  return {
    initAny: function initAny(obj) {
      return dispatch(init(obj.key, obj.data));
    }
  };
}

exports.Provider = connect(null, mapDispatchToProps)(InitProvider);
exports.contextTypes = InnerProvider.contextTypes;