'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Route = require('./Route');
var MatchResult = require('./MatchResult');

var Router = function () {
  function Router(_ref) {
    var routes = _ref.routes,
        session = _ref.session,
        redirects = _ref.redirects;

    _classCallCheck(this, Router);

    this.routes = [];
    this.addRoutes(routes);
    this.session = session;

    this.redirects = {};
    var redirect_args = ['notFound', 'sessionMissing', 'sessionExisting', 'roleMissing'];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = redirect_args[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var attr = _step.value;

        var name = redirects[attr];
        if (!(name in routes)) {
          throw new Error('No route named ' + name);
        } else {
          this.redirects[attr] = this.getRoute({ name: name });
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

    this.listeners = [];
  }

  _createClass(Router, [{
    key: 'addRoutes',
    value: function addRoutes(routes) {
      var entries = Object.entries(routes);
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = entries[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _ref2 = _step2.value;

          var _ref3 = _slicedToArray(_ref2, 2);

          var name = _ref3[0];
          var config = _ref3[1];
          var pattern = config.path,
              page = config.page,
              session = config.session,
              role = config.role;

          var route = new Route({ name: name, pattern: pattern, page: page, session: session, role: role });
          this.routes.push(route);
        }
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
    }
  }, {
    key: 'getRoute',
    value: function getRoute(query) {
      return this.routes.find(function (route) {
        return Object.entries(query).every(function (_ref4) {
          var _ref5 = _slicedToArray(_ref4, 2),
              k = _ref5[0],
              v = _ref5[1];

          return route[k] === v;
        });
      });
    }

    // match
    // -----
    // Checks whether there is a route matching the passed pathname
    // If there is a match, returns the associated Page and matched params.
    // If no match return NotFound

  }, {
    key: 'match',
    value: function match(input) {
      var url = input.url,
          route = input.route;
      var session = this.session;


      var match = null;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.routes[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var r = _step3.value;

          match = r.match({ url: url, route: route, session: session });
          if (match) {
            break;
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

      if (!match) {
        match = new MatchResult({
          input: input,
          notFound: true,
          redirect: 'notFound'
        });
      }

      var _match = match,
          redirect = _match.redirect;

      if (redirect) {
        if (!(redirect in this.redirects)) {
          throw new Error('Missing redirect for ' + redirect);
        }
        match.redirect = this.redirects[redirect];
        match.url = match.redirect.buildUrl();
        this._go(match.url);
      }

      return match;
    }
  }, {
    key: 'onChange',
    value: function onChange(listener) {
      this.listeners.push(listener);
    }
  }, {
    key: 'go',
    value: function go(_ref6) {
      var url = _ref6.url,
          route = _ref6.route;

      var match = this.match({ url: url, route: route });
      this._go(match.url);
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = this.listeners[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var listener = _step4.value;

          listener(match.url);
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  }, {
    key: '_go',
    value: function _go(url) {
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', url);
      }
    }
  }]);

  return Router;
}();

module.exports = Router;