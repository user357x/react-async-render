/**
 * react-async-render
 * (c) 2015-2016 eBay Software Foundation
 * react-async-render may be freely distributed under the MIT license.
 */

var { createStore, applyMiddleware, combineReducers } = require('redux');
var thunk = require('redux-thunk');

var createStoreWithMiddleware = applyMiddleware(thunk)(createStore);
var reducer = require('./reducer');

module.exports = function(reducers){
  reducers = reducers || {};
  var _reducers = {
    ...reducers,
    initialize: reducer
  }
  var store = createStoreWithMiddleware(combineReducers(_reducers));
  return store;
};

