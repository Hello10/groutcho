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
        _ref$max_redirects = _ref.max_redirects,
        max_redirects = _ref$max_redirects === undefined ? 10 : _ref$max_redirects;

    _classCallCheck(this, Router);

    this.routes = [];
    this.addRoutes(routes);
    this.max_redirects = max_redirects;

    this.redirects = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.entries(redirects)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _ref2 = _step.value;

        var _ref3 = _slicedToArray(_ref2, 2);

        var _name = _ref3[0];
        var test = _ref3[1];

        this.redirects.push({ name: _name, test: test });
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

          var _name2 = _ref5[0];
          var config = _ref5[1];

          config.name = _name2;
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
      var original = this._match(input);
      var redirect = this._checkRedirects({ original: original });
      if (redirect) {
        redirect.isRedirect({ original: original });
        return redirect;
      } else {
        return original;
      }
    }
  }, {
    key: '_match',
    value: function _match(input) {
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

      return match;
    }
  }, {
    key: '_checkRedirects',
    value: function _checkRedirects(_ref8) {
      var original = _ref8.original,
          _ref8$previous = _ref8.previous,
          previous = _ref8$previous === undefined ? null : _ref8$previous,
          _ref8$current = _ref8.current,
          current = _ref8$current === undefined ? null : _ref8$current,
          _ref8$num_redirects = _ref8.num_redirects,
          num_redirects = _ref8$num_redirects === undefined ? 0 : _ref8$num_redirects,
          _ref8$history = _ref8.history,
          history = _ref8$history === undefined ? [] : _ref8$history;
      var max_redirects = this.max_redirects;

      if (num_redirects >= max_redirects) {
        throw new Error('Number of redirects exceeded max_redirects (' + max_redirects + ')');
      }

      function deepEqual(a, b) {
        var stringify = JSON.stringify;

        return stringify(a) === stringify(b);
      }

      // if current is the same as original, then we've looped, so this shouldn't
      // be a redirect
      if (current && previous) {
        var same_route = current.route === previous.route;
        var same_params = deepEqual(current.params, previous.params);
        if (same_route && same_params) {
          return previous;
        }
      }

      if (!current) {
        current = original;
        history = [original];
      }

      var next = false;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = this.redirects[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var _ref9 = _step4.value;
          var _name3 = _ref9.name;
          var test = _ref9.test;

          // test returns false if no redirect is needed
          next = test(current);
          if (next) {
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
        previous = current;
        // we got a redirect
        current = this._match(next);
        if (!current) {
          throw new Error('No match for redirect result for ' + name);
        }
        history.push(current);
        num_redirects++;
        return this._checkRedirects({ original: original, previous: previous, current: current, num_redirects: num_redirects, history: history });
      } else {
        // if we've had any redirects return current, otherwise
        if (num_redirects > 0) {
          return current;
        } else {
          return false;
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