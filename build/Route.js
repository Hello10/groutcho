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
   * @param {boolean} session - If true, require a session. If false, require no session. If undefined (default), allow either.
   * @param {string|string[]} roles - If truthy, require role(s). If non-truthy (default), don't require role.
   */
  function Route(_ref2) {
    var name = _ref2.name,
        pattern = _ref2.pattern,
        page = _ref2.page,
        session = _ref2.session,
        _ref2$role = _ref2.role,
        role = _ref2$role === undefined ? [] : _ref2$role;

    _classCallCheck(this, Route);

    this.name = name;
    this.pattern = pattern;
    this.page = page;
    this.session = session;
    this.roles = Array.isArray(role) ? role : [role];

    // create matcher for this route (uses path-to-regexp)
    var options = {
      sensitive: false,
      strict: false,
      end: true
    };
    this.param_keys = [];
    this.matcher = pathToRegexp(pattern, this.param_keys, options);
  }

  /**
  * Check whether this route matches a passed path or route.
  * @return {MatchedRoute}
  */
  // you can either pass a path to match


  _createClass(Route, [{
    key: 'match',
    value: function match(_ref3) {
      var url = _ref3.url,
          route = _ref3.route,
          session = _ref3.session;

      var match = void 0;
      if (url) {
        match = this._matchUrl(url);
      } else {
        match = this._matchRoute(route);
      }

      if (!match) {
        return false;
      }

      var require_session = false;
      var require_no_session = false;
      var route_session = this.session;
      if (route_session !== undefined) {
        require_session = !!route_session;
        require_no_session = !route_session;
      }

      var require_role = this.roles.length > 0;
      var has_role = this.roles.some(session.hasRole);

      var redirect = null;
      if (session.signedIn()) {
        if (require_no_session) {
          match.redirect = 'sessionExisting';
        }
        if (require_role && !has_role) {
          match.redirect = 'roleMissing';
        }
      } else {
        if (require_session || require_role) {
          match.redirect = 'sessionMissing';
        }
      }

      return match;
    }
  }, {
    key: 'paramNames',
    value: function paramNames() {
      return this.param_keys.map(function (k) {
        return k.name;
      });
    }
  }, {
    key: 'buildUrl',
    value: function buildUrl() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var url = this.buildPath(params);
      var query = this.buildQuery(params);
      if (query.length) {
        url = url + '?' + query;
      }
      return url;
    }
  }, {
    key: 'buildPath',
    value: function buildPath(params) {
      var pattern = this.pattern;

      var buildPath = pathToRegexp.compile(pattern);
      return buildPath(params);
    }
  }, {
    key: 'buildQuery',
    value: function buildQuery(params) {
      var param_names = this.paramNames();

      var query_params = {};
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.entries(params)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _ref4 = _step.value;

          var _ref5 = _slicedToArray(_ref4, 2);

          var name = _ref5[0];
          var value = _ref5[1];

          if (!param_names.includes(name)) {
            query_params[name] = value;
          }
        }
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

      return Querystring.stringify(query_params);
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

      var match = this.matcher.exec(path);
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

      var param_names = this.paramNames();
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
      var param_names = this.paramNames();

      for (var i = 0; i < param_names.length; i++) {
        // TODO: worth handling delim / repeat?
        var _param_keys$i = this.param_keys[i],
            name = _param_keys$i.name,
            repeat = _param_keys$i.repeat,
            delimiter = _param_keys$i.delimiter;

        var value = match[i + 1];
        var decoded = decodeParam({ name: name, value: value });
        if (repeat) {
          decoded = decoded.split(delimiter);
        }
        params[name] = decoded;
      }

      return params;
    }
  }]);

  return Route;
}();

module.exports = Route;