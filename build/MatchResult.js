"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MatchResult = function MatchResult(_ref) {
  var input = _ref.input,
      _ref$route = _ref.route,
      route = _ref$route === undefined ? null : _ref$route,
      _ref$params = _ref.params,
      params = _ref$params === undefined ? {} : _ref$params,
      _ref$notFound = _ref.notFound,
      notFound = _ref$notFound === undefined ? false : _ref$notFound,
      _ref$redirect = _ref.redirect,
      redirect = _ref$redirect === undefined ? null : _ref$redirect,
      _ref$url = _ref.url,
      url = _ref$url === undefined ? null : _ref$url;

  _classCallCheck(this, MatchResult);

  this.input = input;
  this.route = route;
  this.params = params;
  this.notFound = notFound;
  this.redirect = redirect;

  if (!url && route) {
    url = route.buildUrl(params);
  }
  this.url = url;
};

module.exports = MatchResult;