Server side rendering using react-async-render
====

## 1. Background
Simply from the [synchronous API](https://facebook.github.io/react/docs/top-level-api.html#reactdomserver) provided by React, we know the server side rendering could not be done well if your React application needs to load data asychronously.

There are a few React server side rendering samples on github. But some of them are too simple to be considered as a solution for a complex SPA, which may involve multiple external requests to finish a page rendering.

In theory, to make an asychronous server side rendering with React, we need to meet at-least two requirements:
  - Req #1. collect/register every asychronous requests that defined in every React Component's `constructor` and/or `componentWillMount` methods that are invoked before the very first-time `render`.
  - Req #2. able to get the DOM string when all these registered requests are fulfilled.

There is already a solution for isomophic rendering - [react-isomorphic-starterkit](https://github.com/RickWong/react-isomorphic-starterkit), which uses [react-transmit](https://www.npmjs.com/package/react-transmit). I didn't try it, but from my first glance, I think it has to create one container for every React Component so that it can use its own way to control the rendering tree of all components in an application. It's brilliant idea that it should work well with old version of React.

## 2. Using Redux for React (v0.14) server side rendering
This solution is by leveraging [Redux](https://www.npmjs.com/package/react-redux) store. The initial value of Redux store can be applied to React components before their first-time `render` happens, by mapping store state value to components' `props` attribute. So as long as the inital value of Redux store could be set dynamically, the React application's DOM string (Req #2) could be got by using [`ReactDOMServer.renderToString`](https://facebook.github.io/react/docs/top-level-api.html#reactdomserver.rendertostring) method.

The easiest way to dynamically set the initial value of Redux store, is just to render the React application, and set state to Redux store after every external requests fulfilled. As the Redux store is a singleton, it can be re-used in another rendering cycle of the application after it's initial state is fully set up.

With this thought, a mixin method is introduced to meet the Req #1 - `asyncInit`. It's used to register asynchronous actions that need to perform to prepare data for the component's rendering.

### Usage
Below is an example how to use it in a Component.

~~~~javascript~~~~
    // ArticleList.react.js
    var React = require('react');
    var Isomophic = require('react-async-render'); // require this module
    var requestMixin = require('../mixin/request'); // provide this.fetch mixin method
    var ArticleItem = require('./ArticleItem.react');
    var reactMixin = require('react-mixin');
    var {connect} = require('react-redux');

    class ArticleList extends React.Component {
      constructor(props, context){ //context argument is REQUIRED
        super(props, context);
        this.state = {
          //get data from this.props.data which initialied from Redux store
          data: this.props.data
        };
        if(this.props.url){
          this.asyncInit(function(done){
              // fetch the articles async
              this.fetch(this.props.url, function(err, resp){
                var initialData = {data:resp.results}
                //passing the second argument as initial data in Redux store
                done(err, initialData);
              }.bind(this));
            }.bind(this),
            this.props.initKey, // REQUIRED. Used for initial data in Redux store
            true // set to true means that it will invoke this.setState with the initialData
          );
        }
      }

      render() {
        var data = this.state.data || [];
        var items = data.map(function(item){
          return (
            <li className="articleItem" key={item.nid}><ArticleItem {...item} /></li>
          );
        });
        return (
          <div className={classes}>
            <ul>
              {items}
            </ul>
          </div>
        );
      }
    }

    reactMixin(ArticleList.prototype, requestMixin); //mixin this.request method
    reactMixin(ArticleList.prototype, Isomophic.mixin); //REQUIRED. mixin this.asyncInit method

    ArticleList.contextTypes = {
      ...Isomophic.contextTypes //contextTypes is REQUIRED
    };
    module.exports = ArticleList;
~~~~

Load init data from Redux store, and set to `data` props of `ArticleList`.
~~~~javascript~~~~
    // AuthorPage.react.js
    var React = require('react');
    var AuthorDetail = require('./AuthorDetail.react'); //Just another React Component
    var ArticleList  = require('./ArticleList.react');
    var {connect} = require('react-redux');

    class AuthorPage extends React.Component{
      constructor(props, context){
        super(props, context);
      }

      render() {
        var authorArticlesUrl = `/api/author/${this.props.params.authorId}/articles`;
        return (
          <div>
            <AuthorDetail
              authorId={this.props.params.authorId}
              initKey={"Author"} //REQUIRED
              data={this.props.authorData} />
            <ArticleList
              url={authorArticlesUrl}
              initKey={"AuthorArticles"} //REQUIRED
              data={this.props.articleListData}/>
          </div>
        );
      }
    }

    function mapStateToProps(state) {
      var idata = state.initialize || {}; //`initialize` is the reserved namespace in Redux store for server rendering
      return {
        authorData: idata.Author && idata.Author.data, // `Author` match to the initKey set above
        articleListData: idata.AuthorArticles && idata.AuthorArticles.data // `AuthorArticles` match to the initKey set above
      };
    }

    module.exports = connect(mapStateToProps)(AuthorPage);
~~~~

In express app.js file, below snippet might be needed to make it work:

~~~~javascript~~~~
  var {RoutingContext, match} = require('react-router');
  var routes = require('../shared/routes'); //React-router route config js
  var appReducer = require('../shared/reducers'); //if app uses Redux as well
  var Isomophic = require('react-async-render');
  var {createLocation} = require('history');

  //Common usage with React-router for server side rendering
  app.use('/', function(req, res){
    var location = createLocation(req.url);
    match({ routes, location }, (error, redirectLocation, renderProps) => {
      if (redirectLocation){
        res.redirect(301, redirectLocation.pathname + redirectLocation.search);
      }
      else if (error){
        res.send(500, error.message);
      }
      else if (renderProps == null){
        res.send(404, 'Not found');
      }
      else{
        render(renderProps, res);
      }
    });
  });

  function render(renderProps, res){
    //replace below with other App component if it's not using react-router
    var app = ( <RoutingContext {...renderProps} /> );

    Isomophic.renderToString(app, appReducer)
      .then(function(html){
        return res.render('react_index.dust', {html: html});
      }, function(err){
        //err handling
      });
  }
~~~~

## 3. Pros and Cons of this solution

### Pros
- Minor changes to existing React application, especially when it uses Redux as well.
- On demand server side rendering. Able to choose which components need to render on server side.

### Cons
- Honestly, it invokes `ReactDOMServer.renderToString` twice to get the HTML snippet. And it relies on latest React (v0.14).
- Page will flicker once in browser after page load. The reason is that React found the HTML is different than expected, so it re-renders. Error codes shown on Developer console like below:

  ~~~~
  Warning: React attempted to reuse markup in a container but the checksum was invalid.
  This generally means that you are using server rendering and the markup generated on the server was not what the client was expecting.
  React injected new markup to compensate which works but you have lost many of the benefits of server rendering. Instead, figure out why the markup being generated is different on the client or server
  ~~~~


Due to the 2nd Cons I mentioned above, the flicker is definitely not a good user experience. But it doesn't matter if the contents are just served to search engine. If you just starts/plans your React application with server side rendering, I would suggest starting with [react-isomorphic-starterkit](https://github.com/RickWong/react-isomorphic-starterkit). If you want to add server side rendering capablitity to your existing React app, just to serve search engine or social share, please try this.

  ~~~~
  npm install react-async-render --save
  ~~~~