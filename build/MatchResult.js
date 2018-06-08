"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MatchResult = function () {
  function MatchResult(_ref) {
    var input = _ref.input,
        _ref$route = _ref.route,
        route = _ref$route === undefined ? null : _ref$route,
        _ref$params = _ref.params,
        params = _ref$params === undefined ? {} : _ref$params;

    _classCallCheck(this, MatchResult);

    this.input = input;
    this.route = route;
    this.params = params;
    this.redirect = false;
    this.original = null;
    this.url = route.buildUrl(params);
  }

  _createClass(MatchResult, [{
    key: "isRedirect",
    value: function isRedirect(_ref2) {
      var original = _ref2.original;

      this.redirect = true;
      this.original = original;
    }
  }]);

  return MatchResult;
}();

module.exports = MatchResult;