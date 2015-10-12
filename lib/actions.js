/**
 * react-async-render
 * (c) 2015-2016 eBay Software Foundation
 * react-async-render may be freely distributed under the MIT license.
 */

"use strict";

exports.init = function (initKey, value) {
  if (initKey && value) {
    return {
      type: initKey,
      data: value
    };
  } else {
    return;
  }
};