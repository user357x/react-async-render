/**
 * react-async-render
 * (c) 2015-2016 eBay Software Foundation
 * react-async-render may be freely distributed under the MIT license.
 */

var React = require('react');
var Q = require('kew');
var {connect, Provider} = require('react-redux');
var {init} = require('./actions');

function Queue(initFunc){
  var queue = [];
  var initAny = initFunc;
  this.addToQueue = function(promise){
    queue.push(promise);
  };
  this.resetQueue = function(){
    queue = [];
  };
  this.resolveAll = function(){
    var p;
    if(queue.length){
      p = Q.all(queue).then(function(results){
        if(results && results.length){
          var _results = results.slice(0);
          for(var i = 0, m = _results.length; i < m; i++){
            var result = _results[i];
            if(typeof initAny == 'function'){
              initAny(result);
            }
          }
        }
        return results;
      }, function(err){
        console.error('##### error:', err.stack);
      });
    }else{
      p = Q.fcall(function(){return [];});
    }
    return p;
  };
}


class InitProvider extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      store: this.props.store || require('./store')()
    };
  }
  getChildContext(){
    return {
      asyncQ: new Queue(this.props.initAny)
    };
  }
  render() {
    return (
      <Provider store={this.state.store}>
        <InnerProvider onResolve={this.props.onResolve}>
          {this.props.children}
        </InnerProvider>
      </Provider>
    );
  }
}

InitProvider.childContextTypes = {
  asyncQ: React.PropTypes.object
};

class InnerProvider extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    this.context.asyncQ.resetQueue();
    if(typeof this.props.onResolve == 'function'){
      this.props.onResolve(this.context.asyncQ.resolveAll);
    }
    var children = this.props.children;

    if (typeof children === 'function') {
      return children();
    }
    return children;
  }
}

InnerProvider.contextTypes = {
    asyncQ: React.PropTypes.object
};

function mapDispatchToProps(dispatch){
  return {
    initAny: (obj) => dispatch(init(obj.key, obj.data))
  }
}

exports.Provider = connect(null, mapDispatchToProps)(InitProvider);
exports.contextTypes = InnerProvider.contextTypes;