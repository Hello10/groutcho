const Route = require('./Route');
const MatchResult = require('./MatchResult');

class Groutcho {
  constructor ({
    routes,
    session,
    notFound,
    redirects
  }) {
    this.routes = [];
    this.addRoutes(routes);
    this.session = session;
    this.notFound = notFound;

    this.redirects = {};
    let redirect_args = [
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
  match ({url, route}) {
    let {session} = this;
    for (const r of this.routes) {
      let result = r.match({url, route, session});
      if (result) {
        let {redirect} = result;
        if (redirect) {
          result.redirect = this.redirects[redirect];
          result.url = result.redirect.buildUrl();
          this._go(result.url);
        }
        return result;
      }
    }

    if (this.notFound) {
      return new MatchResult({
        input: {
          url,
          route
        },
        notFound: this.notFound,
        url: this.notFound.path
      });
    } else {
      throw new Error('Route not found');
    }
  }

  onChange (listener) {
    this.listeners.push(listener);
  }

  go ({url, route}) {
    let match = this.match({url, route});
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

module.exports = Groutcho;
