react-async-render
====
Using Redux to resolve React asynchronous rendering issue on server side.

~~~~
npm install react-async-render --save
~~~~

## 1. What's the problem with React server side rendering?
Simply from the synchronous nature of [ReactDOMServer API](https://facebook.github.io/react/docs/top-level-api.html#reactdomserver) definition, we know the server side rendering could not be done well if your React application needs to load data asychronously. That means if you render React application on server side, you are only able to get HTML layout and static contents.


## 2. How does react-async-render resolve this problem?
In theory, to achieve asychronous server side rendering with React, it needs to:
  - register every asychronous request that is defined in every React Component's `constructor` and/or `componentWillMount` methods that are invoked before the very first-time `render` happens.
  - get the DOM string when all these registered requests are fulfilled.

To fill these requriments, `react-async-render` provides
  - a mixin method - `asyncInit` - to allow React Components to register asynchronous actions for initialization.
  - a method - `renderToString` - to render any React Component and return a promise of DOM string.

With leveraging [Redux](https://www.npmjs.com/package/react-redux) store, `react-async-render` resolves this problem by rendering the React Component twice.
  - During the first-time render, Components use `asyncInit` method to register asynchronous actions, and submit initial data when the actions are done. The initial data of Components will be stored in the Redux store, and the Redux store will be re-used in the second-time render.
  - When all asynchorous actions are done, all the initial data are set in Redux store, the second-time render occurs. The initial data in Redux store could be assigned to Components' `props` attribute, so those Components could use the `props` data to render.

**Note: `react-async-render` depends on React v0.14**

## 3. How to use react-async-render?

### 3.1 On React Application side
Include the react-async-render in React Component which needs load data asynchronously
~~~~js
var AsyncRender = require('react-async-render');
~~~~
Merge the mixin to Component, and set up context for the mixin method
~~~~js
var reactMixin = require('react-mixin');
//... require other libraries
class MyComponent extends React.Component{
  constructor(props, context){
    super(props, context);
    //... other codes
  }
  // ... other methods
}

MyComponent.contextTypes = {
  ...AsyncRender.contextTypes
};

reactMixin(MyComponent.prototype, AsyncRender.mixin);
~~~~

Then register asynchronous actions in Component's `consturctor` method, or `componentWillMount` method

~~~~js
constructor(props, context){
  super(props, context);
  // ... other codes
  this.state = {
    myData: this.props.data
  };
  this.asyncInit(
    function(done){
      asyncAction(function(err, response){
        var initialData = {myData: response};
        // use callback `done` method to submit initial data.
        // this.setState(initialData) will be invoked after submitting
        done(err, initialData);
      });
    },
    'MyCompInitKey', //any string identifier, serves as key in Redux store
    false // set it to true to avoid setState method. In most cases, use default false value
  );
}
~~~~

Assign initial data from Redux store to Component's `props`.
~~~~js
var {connect} = require('react-redux');

// ... MyComponent class

function mapStateToProps(state){
  //`initialize` is the reserved namespace in Redux store for `react-async-render`
  var initStore = state.initialize || {};
  return {
    data: initStore.MyCompInitKey && initStore.MyCompInitKey.myData
  };
}

module.exports = connect(mapStateToProps)(MyComponent);
~~~~
### 3.2 On Node.js server side
Using `renderToString` method to render any React Component
~~~~jsx
var AsyncRender = require('react-async-render');
var app = (
  <MyApp>
    <MyComponent />
    <MyOtherComponent />
  </MyApp>
);
AsyncRender.renderToString(app).then(function(html){
  //send html to client
});
~~~~
### 3.3 Example
Below are complete code examples about how to use `react-async-render` in React Components and Express.js server. It will build an `AuthorPage` Component, which has `AuthorDetail` (No code provided. It has similar code structure to `ArticleList`) and Author's `ArticleList`.

**ArticleList.react.js** (read the comments)
~~~~jsx
    // ArticleList.react.js
    var React = require('react');
    var AsyncRender = require('react-async-render'); // require this module
    var request = require('request');
    var ArticleItem = require('./ArticleItem.react');
    var reactMixin = require('react-mixin');
    var {connect} = require('react-redux');

    class ArticleList extends React.Component {
      constructor(props, context){ //context argument is REQUIRED
        super(props, context);
        this.state = {
          //this.props.initData will be set from its parent Component
          data: this.props.initData
        };
        if(this.props.url){
          this.asyncInit(
            function(done){
              // fetch the articles asyncly
              request({
                method: 'GET',
                uri: this.props.url,
                json: true,
              }, function(err, response, body){
                var initialData = {data: body};
                //set the second argument as initial data in Redux store
                done(err, initialData);
              });
            },
            this.props.initKey // REQUIRED. Used for initial data in Redux store
          );
        }
      }

      render() {
        var data = this.state.data || [];
        var items = data.map(function(item){
          return (
            <li className="articleItem" key={item.nid}><ArticleItem data={item} /></li>
          );
        });
        return (
          <div>
            <ul>
              {items}
            </ul>
          </div>
        );
      }
    }

    reactMixin(ArticleList.prototype, AsyncRender.mixin); //REQUIRED. mixin this.asyncInit method

    ArticleList.contextTypes = {
      ...AsyncRender.contextTypes //contextTypes is REQUIRED
    };
    module.exports = ArticleList;
~~~~

Load init data from Redux store, and set to `data` props of `ArticleList`.
**AuthorPage.react.js** (read the comments)
~~~~jsx
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
              initData={this.props.authorData} />
            <ArticleList
              url={authorArticlesUrl}
              initKey={"AuthorArticles"} //REQUIRED
              initData={this.props.articleListData}/>
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

Setting up Express server in **app.js** (read the comments)
~~~~jsx
  // ... var express = require('express');
  // ... var app = express();
  // ... other code set up express server
  var {RoutingContext, match} = require('react-router');
  var routes = require('../shared/routes'); //React-router route config js
  var appReducer = require('../shared/reducers'); //if app uses Redux as well
  var AsyncRender = require('react-async-render');
  var {createLocation} = require('history');

  //Typical usage with react-router for server side rendering
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
    var app = ( <RoutingContext {...renderProps} /> ); //Can be any React Component

    AsyncRender.renderToString(app, appReducer)
      .then(function(html){
        return res.render('react_index.dust', {html: html});
      }, function(err){
        //err handling
      });
  }
~~~~

## 4. Known issue

When use `react-async-render` to generate the HTML page on server side, the browser will flicker once after loading the HTML page. The reason is that React found the HTML generated server side is different than expected, so it re-renders.

Error codes shown on Developer console like below:

  ~~~~
  Warning: React attempted to reuse markup in a container but the checksum was invalid.
  This generally means that you are using server rendering and the markup generated on the server was not what the client was expecting.
  React injected new markup to compensate which works but you have lost many of the benefits of server rendering. Instead, figure out why the markup being generated is different on the client or server
  ~~~~


The flickering page is definitely not a good user experience. But if you use server rendering just for serving search engines, `react-async-render` could work well for that purpose.


#### Another solution?
See [react-isomorphic-starterkit](https://github.com/RickWong/react-isomorphic-starterkit), which uses [react-transmit](https://www.npmjs.com/package/react-transmit).

Seemingly this solution has to create one container for every React Component so that it can use its own way to control the rendering.