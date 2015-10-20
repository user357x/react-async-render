/**
 * react-async-render
 * (c) 2015-2016 eBay Software Foundation
 * react-async-render may be freely distributed under the MIT license.
 */

var {Provider, contextTypes, Script} = require('./provider');
var React = require('react');
var {renderToStaticMarkup} = require('react-dom/server');
var createStore = require('./store');
var Q = require('kew');

class InitScript extends React.Component {
  render(){
    var store = this.props.store;
    var initState = {};
    if(store && typeof store.getState == 'function'){
      initState = store.getState();
    }
    var body = "window.__INITIAL_STATE__ = " + JSON.stringify(initState);
    return (
        <script dangerouslySetInnerHTML={{__html:body}}>
        </script>
    );
  }
}

exports.render = function(appComponent, appReducer){
  var store = createStore(appReducer || {});

  var allPromises;

  var onResolve = function(promises){
    allPromises = promises;
  };

  var app = (
    <Provider store={store} onResolve={onResolve}>
      {appComponent}
    </Provider>
  );

  var html = renderToStaticMarkup(app);
  var script = '';
  if(allPromises){
    return allPromises().then(function(results){
      if(results && results.length){
        html = renderToStaticMarkup(app);
      }
      var scriptTag = (<InitScript store={store} />);
      script = renderToStaticMarkup(scriptTag)
      return {store,script,html};
    });
  }else{
    return Q.resolve({store,script,html});
  }
};
exports.renderToString = function(appComponent, appReducer){
  return exports.render(appComponent, appReducer).then(function({store, html, script}){
    return html;
  });
};

exports.contextTypes = contextTypes;
exports.mixin = require('./mixin');
exports.Provider = exports.AsyncProvider = Provider;
exports.store = exports.createStore = createStore;
exports.reducers = exports.initReducers = {initialize: require('./reducer')};