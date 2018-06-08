const type = require('type-of-is');

const Route = require('./Route');
const MatchResult = require('./MatchResult');

class Router {
  constructor ({
    routes,
    redirects,
    maxRedirects = 10
  }) {
    this.routes = [];
    this.addRoutes(routes);
    this.maxRedirects = maxRedirects;

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

    let redirect = this._checkRedirects(match);
    if (redirect) {
      redirect.isRedirect({original: match});
      return redirect;
    } else {
      return match;
    }
  }

  _checkRedirects (original) {
    const {maxRedirects} = this;
    let num_redirects = 0;

    let previous = false;
    let current = original;

    while (true) {
      if (num_redirects >= maxRedirects) {
        throw new Error(`Number of redirects exceeded maxRedirects (${maxRedirects})`);
      }

      let next = false;
      for (let {name, test} of this.redirects) {
        // test returns false if no redirect is needed
        next = test(current);
        if (next) {
          previous = current;
          current = this.match(next);
          break;
        }
      }

      if (next) {
        num_redirects++;
        // don't allow redirect to the same route
        if (previous && (previous.route === current.route)) {
          return current;
        }
      } else {
        // if no previous there was never a redirect, so return false
        // otherwise return the current (last) redirect
        return (current === original) ? false : current;
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
