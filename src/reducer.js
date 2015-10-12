/**
 * react-async-render
 * (c) 2015-2016 eBay Software Foundation
 * react-async-render may be freely distributed under the MIT license.
 */
var initialState = {};

module.exports = function(state = initialState, action = {}){
  var k = action.type;
  return {
    ...state,
    [k]:action.data
  };
};