const type = require('type-of-is');

const Route = require('./Route');
const MatchResult = require('./MatchResult');

class Router {
  constructor ({
    routes,
    session,
    redirects
  }) {
    this.routes = [];
    this.addRoutes(routes);
    this.session = session;

    this.redirects = {};
    let redirect_args = [
      'notFound',
      'sessionMissing',
      'sessionExisting',
      'roleMissing'
    ];
    for (let attr of redirect_args) {
      const name = redirects[attr];
      if (!(name in routes)) {
        throw new Error(`No route named ${name}`);
      } else {
        this.redirects[attr] = this.getRoute({name});
      }
    }

    this.listeners = [];
  }

  addRoutes (routes) {
    let entries = Object.entries(routes);
    for (const [name, config] of entries) {
      const {path: pattern, page, session, role} = config;
      const route = new Route({name, pattern, page, session, role});
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

  // match
  // -----
  // Checks whether there is a route matching the passed pathname
  // If there is a match, returns the associated Page and matched params.
  // If no match return NotFound
  match (input) {
    input = (()=> {
      switch (type(input)) {
        case String:
          return {url: input};
        case Object:
          if (input.name) {
            return {route: input};
          } else {
            return input;
          }
      }
    })();

    let {url, route} = input;
    let {session} = this;

    let match = null;
    for (const r of this.routes) {
      match = r.match({url, route, session});
      if (match) {
        break;
      }
    }

    if (!match) {
      match = new MatchResult({
        input,
        notFound: true,
        redirect: 'notFound'
      });
    }

    let {redirect} = match;
    if (redirect) {
      if (!(redirect in this.redirects)) {
        throw new Error(`Missing redirect for ${redirect}`);
      }
      match.redirect = this.redirects[redirect];
      match.url = match.redirect.buildUrl();
      this._go(match.url);
    }

    return match;
  }

  onChange (listener) {
    this.listeners.push(listener);
  }

  go (input) {
    let match = this.match(input);
    this._go(match.url);
    for (let listener of this.listeners) {
      listener(match.url);
    }
  }

  _go (url) {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', url);
    }
  }
}

module.exports = Router;
