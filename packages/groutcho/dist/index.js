function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var type = _interopDefault(require('type-of-is'));
var util = require('@hello10/util');
var Logger = _interopDefault(require('@hello10/logger'));
var Url = _interopDefault(require('url'));
var Querystring = _interopDefault(require('querystring'));
var pathToRegexp = require('path-to-regexp');

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

const logger = new Logger('groutcho');

class MatchResult {
  constructor({
    input,
    route = null,
    url = null,
    params = {},
    redirect = false
  }) {
    this.input = input;
    this.route = route;
    this.params = params;
    this.redirect = redirect;
    this.original = null;
    this.url = url || route.buildUrl(params);
  }

  isRedirect({
    original
  }) {
    this.redirect = true;
    this.original = original;
  }

}

class Route {
  /**
   * Represents a route
   * @constructor
   * @param {string} name - Name for the route.
   * @param {string} pattern - Pattern used by path-to-regexp to match route.
   * @param {Object} page - Page to be returned along with params for this route.
   */
  constructor(params) {
    const required_params = ['name', 'pattern', 'page'];

    for (const param of required_params) {
      if (!(param in params)) {
        throw new Error(`Missing route param ${param}`);
      }
    } // Allow for dynamic params in routes to be used with
    // custom redirects etc.


    for (const [k, v] of Object.entries(params)) {
      if (['is', 'match', 'buildUrl'].includes(k)) {
        throw new Error(`Invalid route param ${k}`);
      }

      this[k] = v;
    } // create matcher for this route (uses path-to-regexp)


    const options = {
      sensitive: false,
      strict: false,
      end: true
    };
    this._param_keys = [];
    this._matcher = pathToRegexp.pathToRegexp(this.pattern, this._param_keys, options);
  }
  /**
  * Check whether this route matches a passed path or route.
  * @return {MatchedRoute}
  */
  // you can either pass a path to match


  match(args) {
    const fn_name = `_match${args.url ? 'Url' : 'Route'}`;
    return this[fn_name](args);
  }

  is(test) {
    if (test.indexOf('/') !== -1) {
      return !!this._matcher.exec(test);
    } else {
      return this.name === test;
    }
  }

  _matchUrl(input) {
    const {
      url
    } = input;
    const {
      query: query_params,
      pathname: path
    } = Url.parse(url, true);

    const match = this._matcher.exec(path);

    if (!match) {
      return false;
    }

    const route_params = this._getParamsFromMatch(match);

    const params = _extends({}, route_params, query_params);

    return new MatchResult({
      route: this,
      input,
      params
    });
  } // matches if
  // 1) name matches
  // 2) all named params are present


  _matchRoute(input) {
    const {
      route
    } = input;
    const {
      name,
      params = {}
    } = route; // Name of passed route must match this route's name

    if (name !== this.name) {
      return false;
    }

    const param_names = this._requiredParamNames();

    const has_all_params = param_names.every(name => name in params);

    if (!has_all_params) {
      return false;
    } // All named params are present, its a match


    return new MatchResult({
      input,
      route: this,
      params
    });
  }

  _getParamsFromMatch(match) {
    const params = {};

    const param_names = this._paramNames();

    for (let i = 0; i < param_names.length; i++) {
      // TODO: worth handling delim / repeat?
      const {
        name,
        repeat,
        delimiter,
        optional
      } = this._param_keys[i];
      const value = match[i + 1];
      const defined = value !== undefined;
      let decoded = defined ? decodeURIComponent(value) : value;

      if (repeat) {
        decoded = decoded.split(delimiter);
      }

      if (defined || !optional) {
        params[name] = decoded;
      }
    }

    return params;
  }

  buildUrl(params = {}) {
    let url = this._buildPath(params);

    const query = this._buildQuery(params);

    if (query.length) {
      url = `${url}?${query}`;
    }

    return url;
  }

  _buildPath(params) {
    const {
      pattern
    } = this;
    const buildPath = pathToRegexp.compile(pattern);
    return buildPath(params);
  }

  _buildQuery(params) {
    const param_names = this._paramNames();

    const query_params = {};

    for (const [name, value] of Object.entries(params)) {
      if (!param_names.includes(name)) {
        query_params[name] = value;
      }
    }

    return Querystring.stringify(query_params);
  }

  _paramNames() {
    return this._param_keys.map(k => k.name);
  }

  _requiredParamNames() {
    return this._param_keys.filter(k => !k.optional).map(k => k.name);
  }

}

const getExtra = util.omitter(['route', 'url']);
class Router {
  constructor({
    routes,
    redirects,
    max_redirects = 10
  }) {
    this.routes = [];
    this.addRoutes(routes);
    this.max_redirects = max_redirects;
    this.redirects = [];

    for (const [name, test] of Object.entries(redirects)) {
      this.redirects.push({
        name,
        test
      });
    }

    this.listeners = [];
    logger.debug('Constructed router', this);
  }

  addRoutes(routes) {
    const entries = Object.entries(routes);

    for (const [name, config] of entries) {
      config.name = name;
      const route = new Route(config);
      logger.debug('Adding route', route);
      this.routes.push(route);
    }
  }

  getRoute(query) {
    return this.routes.find(route => {
      return Object.entries(query).every(([k, v]) => {
        return route[k] === v;
      });
    });
  }

  getRouteByName(name) {
    const route = this.getRoute({
      name
    });

    if (!route) {
      const msg = `No route named ${name}`;
      logger.error(msg);
      throw new Error(msg);
    }

    return route;
  } // match
  // -----
  // Checks whether there is a route matching the passed pathname
  // If there is a match, returns the associated Page and matched params.
  // If no match return NotFound


  match(input) {
    input = this.normalizeInput(input);
    const extra = getExtra(input);

    const original = this._match(input);

    const redirect = this._checkRedirects({
      original,
      extra
    });

    logger.debug('match', {
      input,
      original,
      redirect
    });

    if (redirect) {
      redirect.isRedirect({
        original
      });
      return redirect;
    } else {
      return original;
    }
  }

  normalizeInput(input) {
    switch (type(input)) {
      case String:
        if (input.indexOf('/') !== -1) {
          return {
            url: input
          };
        } else {
          return {
            route: {
              name: input
            }
          };
        }

      case Object:
        if (input.name) {
          return {
            route: input
          };
        } else {
          return input;
        }

      default:
        {
          const error = new Error('Invalid input');
          error.input = input;
          throw error;
        }
    }
  }

  _match(input) {
    logger.debug('Attempting to match route', input); // if passed full url, treat as redirect

    const {
      url
    } = input;

    if (url && url.match(/^https?:\/\//)) {
      return new MatchResult({
        redirect: true,
        input,
        url
      });
    }

    let match = null;

    for (const r of this.routes) {
      match = r.match(input);

      if (match) {
        break;
      }
    }

    return match;
  }

  _checkRedirects({
    original,
    extra,
    previous = null,
    current = null,
    num_redirects = 0,
    history = []
  }) {
    logger.debug('Checking redirects', {
      original,
      extra,
      previous,
      current,
      num_redirects,
      history
    });
    const {
      max_redirects
    } = this;

    if (num_redirects >= max_redirects) {
      const msg = `Number of redirects exceeded max_redirects (${max_redirects})`;
      logger.error(msg);
      throw new Error(msg);
    }

    function deepEqual(a, b) {
      const {
        stringify
      } = JSON;
      return stringify(a) === stringify(b);
    } // if current is the same as original, then we've looped, so this shouldn't
    // be a redirect
    // TODO: improve cycle detection


    if (current && previous) {
      const same_route = current.route === previous.route;
      const same_params = deepEqual(current.params, previous.params);

      if (same_route && same_params) {
        logger.debug('Route is same as previous', {
          current,
          previous
        });
        return previous;
      }
    }

    if (!current) {
      current = original;
      history = [original];
    }

    if (current.redirect) {
      return current;
    }

    let next = false;

    if (current && current.route.redirect) {
      next = current.route.redirect(current);
    }

    if (!next) {
      for (const {
        test
      } of this.redirects) {
        // test returns false if no redirect is needed
        next = test(current);

        if (next) {
          break;
        }
      }
    }

    if (next) {
      logger.debug('Got redirect', {
        current,
        next
      }); // we got a redirect

      previous = current;
      next = this.normalizeInput(next);
      current = this._match(_extends({}, next, extra));

      if (!current) {
        const error = new Error('No match for redirect result');
        error.redirect = next;
        throw error;
      }

      history.push(current);
      num_redirects++;
      return this._checkRedirects({
        original,
        previous,
        current,
        num_redirects,
        history,
        extra
      });
    } else if (num_redirects > 0) {
      return current;
    } else {
      return false;
    }
  }

  onGo(listener) {
    this.listeners.push(listener);
  }

  go(input) {
    const match = this.match(input);

    for (const listener of this.listeners) {
      listener(match);
    }

    return match;
  }

}

exports.MatchResult = MatchResult;
exports.Route = Route;
exports.Router = Router;
//# sourceMappingURL=index.js.map
