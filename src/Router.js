const type = require('type-of-is');

const Route = require('./Route');
const MatchResult = require('./MatchResult');

class Router {
  constructor ({
    routes,
    redirects,
    max_redirects = 10
  }) {
    this.routes = [];
    this.addRoutes(routes);
    this.max_redirects = max_redirects;

    this.redirects = [];
    for (let [name, test] of Object.entries(redirects)) {
      this.redirects.push({name, test});
    }

    this.listeners = [];
  }

  addRoutes (routes) {
    let entries = Object.entries(routes);
    for (const [name, config] of entries) {
      config.name = name;
      const route = new Route(config);
      this.routes.push(route);
    }
  }

  getRoute (query) {
    return this.routes.find((route)=> {
      return Object.entries(query).every(([k, v])=> {
        return (route[k] === v);
      });
    });
  }

  getRouteByName (name) {
    let route = this.getRoute({name});
    if (!route) {
      throw new Error(`No route named ${name}`);
    }
    return route;
  }

  // match
  // -----
  // Checks whether there is a route matching the passed pathname
  // If there is a match, returns the associated Page and matched params.
  // If no match return NotFound
  match (input) {
    const original = this._match(input);
    const redirect = this._checkRedirects({original});
    if (redirect) {
      redirect.isRedirect({original});
      return redirect;
    } else {
      return original;
    }
  }

  _match (input) {
    input = (()=> {
      switch (type(input)) {
        case String:
          if (input.indexOf('/') !== -1) {
            return {url: input};
          } else {
            return {route: {name: input}};
          }
        case Object:
          if (input.name) {
            return {route: input};
          } else {
            return input;
          }
      }
    })();

    let match = null;
    for (const r of this.routes) {
      match = r.match(input);
      if (match) {
        break;
      }
    }

    return match;
  }

  _checkRedirects ({
    original,
    current = null,
    num_redirects = 0
  }) {
    const {max_redirects} = this;
    if (num_redirects >= max_redirects) {
      throw new Error(`Number of redirects exceeded max_redirects (${max_redirects})`);
    }

    function deepEqual (a, b) {
      const {stringify} = JSON;
      return (stringify(a) === stringify(b));
    }

    // if current is the same as original, then we've looped, so this shouldn't
    // be a redirect
    if (current) {
      const same_route = (current.route === original.route);
      const same_params = deepEqual(current.params, original.params);
      if (same_route && same_params) {
        return false;
      }
    }

    if (!current) {
      current = original;
    }

    let next = false;
    for (let {name, test} of this.redirects) {
      // test returns false if no redirect is needed
      next = test(current);
      if (next) {
        break;
      }
    }

    if (next) {
      // we got a redirect
      current = this._match(next);
      if (!current) {
        throw new Error(`No match for redirect result for ${name}`);
      }
      num_redirects++;
      return this._checkRedirects({original, current, num_redirects});
    } else {
      // if we've had any redirects return current, otherwise
      if (num_redirects > 0) {
        return current;
      } else {
        return false;
      }
    }
  }

  onChange (listener) {
    this.listeners.push(listener);
  }

  go (input) {
    const match = this.match(input);
    const {url} = match;
    for (let listener of this.listeners) {
      listener(url);
    }
  }
}

module.exports = Router;
