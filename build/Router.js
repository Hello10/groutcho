'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var type = require('type-of-is');

var Route = require('./Route');
var MatchResult = require('./MatchResult');

var Router = function () {
  function Router(_ref) {
    var routes = _ref.routes,
        redirects = _ref.redirects,
        _ref$maxRedirects = _ref.maxRedirects,
        maxRedirects = _ref$maxRedirects === undefined ? 10 : _ref$maxRedirects;

    _classCallCheck(this, Router);

    this.routes = [];
    this.addRoutes(routes);
    this.maxRedirects = maxRedirects;

    this.redirects = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.entries(redirects)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _ref2 = _step.value;

        var _ref3 = _slicedToArray(_ref2, 2);

        var name = _ref3[0];
        var test = _ref3[1];

        this.redirects.push({ name: name, test: test });
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
          var _ref4 = _step2.value;

          var _ref5 = _slicedToArray(_ref4, 2);

          var name = _ref5[0];
          var config = _ref5[1];

          config.name = name;
          var route = new Route(config);
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
        return Object.entries(query).every(function (_ref6) {
          var _ref7 = _slicedToArray(_ref6, 2),
              k = _ref7[0],
              v = _ref7[1];

          return route[k] === v;
        });
      });
    }
  }, {
    key: 'getRouteByName',
    value: function getRouteByName(name) {
      var route = this.getRoute({ name: name });
      if (!route) {
        throw new Error('No route named ' + name);
      }
      return route;
    }

    // match
    // -----
    // Checks whether there is a route matching the passed pathname
    // If there is a match, returns the associated Page and matched params.
    // If no match return NotFound

  }, {
    key: 'match',
    value: function match(input) {
      input = function () {
        switch (type(input)) {
          case String:
            if (input.indexOf('/') !== -1) {
              return { url: input };
            } else {
              return { route: { name: input } };
            }
          case Object:
            if (input.name) {
              return { route: input };
            } else {
              return input;
            }
        }
      }();

      var match = null;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.routes[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var r = _step3.value;

          match = r.match(input);
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

      var redirect = this._checkRedirects(match);
      if (redirect) {
        redirect.isRedirect({ original: match });
        return redirect;
      } else {
        return match;
      }
    }
  }, {
    key: '_checkRedirects',
    value: function _checkRedirects(original) {
      var maxRedirects = this.maxRedirects;

      var num_redirects = 0;

      var previous = false;
      var current = original;

      while (true) {
        if (num_redirects >= maxRedirects) {
          throw new Error('Number of redirects exceeded maxRedirects (' + maxRedirects + ')');
        }

        var next = false;
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = this.redirects[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var _ref8 = _step4.value;
            var name = _ref8.name;
            var test = _ref8.test;

            // test returns false if no redirect is needed
            next = test(current);
            if (next) {
              previous = current;
              current = this.match(next);
              break;
            }
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

        if (next) {
          num_redirects++;
          // don't allow redirect to the same route
          if (previous && previous.route === current.route) {
            return current;
          }
        } else {
          // if no previous there was never a redirect, so return false
          // otherwise return the current (last) redirect
          return current === original ? false : current;
        }
      }
    }
  }, {
    key: 'onChange',
    value: function onChange(listener) {
      this.listeners.push(listener);
    }
  }, {
    key: 'go',
    value: function go(input) {
      var match = this.match(input);
      var url = match.url;
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = this.listeners[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var listener = _step5.value;

          listener(url);
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }
    }
  }]);

  return Router;
}();

module.exports = Router;