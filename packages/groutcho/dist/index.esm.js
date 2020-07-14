import type from 'type-of-is';
import { omitter } from '@hello10/util';
import Logger from '@hello10/logger';
import Url from 'url';
import Querystring from 'querystring';
import { pathToRegexp, compile } from 'path-to-regexp';

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
  constructor(params) {
    const required_params = ['name', 'pattern', 'page'];

    for (const param of required_params) {
      if (!(param in params)) {
        throw new Error(`Missing route param ${param}`);
      }
    }

    for (const [k, v] of Object.entries(params)) {
      if (['is', 'match', 'buildUrl'].includes(k)) {
        throw new Error(`Invalid route param ${k}`);
      }

      this[k] = v;
    }

    const options = {
      sensitive: false,
      strict: false,
      end: true
    };
    this._param_keys = [];
    this._matcher = pathToRegexp(this.pattern, this._param_keys, options);
  }

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
  }

  _matchRoute(input) {
    const {
      route
    } = input;
    const {
      name,
      params = {}
    } = route;

    if (name !== this.name) {
      return false;
    }

    const param_names = this._requiredParamNames();

    const has_all_params = param_names.every(name => name in params);

    if (!has_all_params) {
      return false;
    }

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
    const buildPath = compile(pattern);
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

const getExtra = omitter(['route', 'url']);
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
  }

  match(input) {
    input = this._normalizeInput(input);
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

  _normalizeInput(input) {
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
        throw new Error('Invalid input');
    }
  }

  _match(input) {
    logger.debug('Attempting to match route', input);
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
    }

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
      });
      previous = current;
      next = this._normalizeInput(next);
      current = this._match(_extends({}, next, extra));

      if (!current) {
        throw new Error(`No match for redirect result ${next}`);
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
  }

}

export { MatchResult, Route, Router };
//# sourceMappingURL=index.esm.js.map
