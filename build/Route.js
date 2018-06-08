'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Url = require('url');
var Querystring = require('querystring');
var pathToRegexp = require('path-to-regexp');

var MatchResult = require('./MatchResult');

function decodeParam(_ref) {
  var name = _ref.name,
      value = _ref.value;

  try {
    return decodeURIComponent(value);
  } catch (_) {
    throw new Error('Invalid value for ' + name);
  }
}

var Route = function () {
  /**
   * Represents a route
   * @constructor
   * @param {string} name - Name for the route.
   * @param {string} pattern - Pattern used by path-to-regexp to match route.
   * @param {Object} page - Page to be returned along with params for this route.
   */
  function Route(params) {
    _classCallCheck(this, Route);

    var required_params = ['name', 'pattern', 'page'];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = required_params[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var param = _step.value;

        if (!(param in params)) {
          throw new Error('Missing route param ' + param);
        }
      }

      // Allow for dynamic params in routes to be used with
      // custom redirects etc.
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = Object.entries(params)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var _ref2 = _step2.value;

        var _ref3 = _slicedToArray(_ref2, 2);

        var k = _ref3[0];
        var v = _ref3[1];

        if (['match', 'buildUrl'].includes(k)) {
          throw new Error('Invalid route param ' + k);
        }
        this[k] = v;
      }

      // create matcher for this route (uses path-to-regexp)
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    var options = {
      sensitive: false,
      strict: false,
      end: true
    };
    this._param_keys = [];
    this._matcher = pathToRegexp(this.pattern, this._param_keys, options);
  }

  /**
  * Check whether this route matches a passed path or route.
  * @return {MatchedRoute}
  */
  // you can either pass a path to match


  _createClass(Route, [{
    key: 'match',
    value: function match(_ref4) {
      var url = _ref4.url,
          route = _ref4.route;

      var match = void 0;
      if (url) {
        match = this._matchUrl(url);
      } else {
        match = this._matchRoute(route);
      }

      return match ? match : false;
    }
  }, {
    key: '_matchUrl',
    value: function _matchUrl(url) {
      var name = this.name,
          page = this.page,
          pattern = this.pattern;

      var _Url$parse = Url.parse(url, true),
          query_params = _Url$parse.query,
          path = _Url$parse.pathname;

      var match = this._matcher.exec(path);
      if (!match) {
        return false;
      }

      var route_params = this._getParamsFromMatch(match);
      var params = Object.assign({}, route_params, query_params);

      return new MatchResult({
        input: { url: url },
        route: this,
        params: params
      });
    }

    // matches if
    // 1) name matches
    // 2) all named params are present

  }, {
    key: '_matchRoute',
    value: function _matchRoute(route) {
      var name = route.name,
          params = route.params;
      var pattern = this.pattern,
          page = this.page;

      // Name of passed route must match this route's name

      if (name !== this.name) {
        return false;
      }

      var param_names = this._paramNames();
      var has_all_params = param_names.every(function (name) {
        return name in params;
      });
      if (!has_all_params) {
        return false;
      }

      // All named params are present, its a match
      return new MatchResult({
        input: { route: route },
        route: this,
        params: params
      });
    }
  }, {
    key: '_getParamsFromMatch',
    value: function _getParamsFromMatch(match) {
      var params = {};
      var param_names = this._paramNames();

      for (var i = 0; i < param_names.length; i++) {
        // TODO: worth handling delim / repeat?
        var _param_keys$i = this._param_keys[i],
            name = _param_keys$i.name,
            repeat = _param_keys$i.repeat,
            delimiter = _param_keys$i.delimiter,
            optional = _param_keys$i.optional;

        var value = match[i + 1];
        var defined = value !== undefined;
        var decoded = defined ? decodeParam({ name: name, value: value }) : value;
        if (repeat) {
          decoded = decoded.split(delimiter);
        }
        if (defined || !optional) {
          params[name] = decoded;
        }
      }

      return params;
    }
  }, {
    key: 'buildUrl',
    value: function buildUrl() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var url = this._buildPath(params);
      var query = this._buildQuery(params);
      if (query.length) {
        url = url + '?' + query;
      }
      return url;
    }
  }, {
    key: '_buildPath',
    value: function _buildPath(params) {
      var pattern = this.pattern;

      var buildPath = pathToRegexp.compile(pattern);
      return buildPath(params);
    }
  }, {
    key: '_buildQuery',
    value: function _buildQuery(params) {
      var param_names = this._paramNames();

      var query_params = {};
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = Object.entries(params)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var _ref5 = _step3.value;

          var _ref6 = _slicedToArray(_ref5, 2);

          var name = _ref6[0];
          var value = _ref6[1];

          if (!param_names.includes(name)) {
            query_params[name] = value;
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      return Querystring.stringify(query_params);
    }
  }, {
    key: '_paramNames',
    value: function _paramNames() {
      return this._param_keys.map(function (k) {
        return k.name;
      });
    }
  }]);

  return Route;
}();

module.exports = Route;