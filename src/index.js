/**
 * react-async-render
 * (c) 2015-2016 eBay Software Foundation
 * react-async-render may be freely distributed under the MIT license.
 */

var {Provider, contextTypes} = require('./provider');
var React = require('react');
var {renderToString} = require('react-dom/server');
var store = require('./store');
var Q = require('kew');

exports.render = function(appComponent, appReducer){
  var _store = store(appReducer || {});

  var allPromises;

  var onResolve = function(promises){
    allPromises = promises;
  };

  var app = (
    <Provider store={_store} onResolve={onResolve}>
      {appComponent}
    </Provider>
  );

  var html = renderToString(app);
  if(allPromises){
    return allPromises().then(function(){
      html = renderToString(app);
      return {
        store: _store,
        html
      };
    });
  }else{
    return Q.resolve({
      store: _store,
      html
    });
  }
};
exports.renderToString = function(appComponent, appReducer){
  return exports.render(appComponent, appReducer).then(function({store, html}){
    return html;
  });
};

exports.contextTypes = contextTypes;
exports.mixin = require('./mixin');