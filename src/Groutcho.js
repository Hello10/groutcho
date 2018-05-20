const Route = require('./Route');
const Errors = require('./Errors');
const MatchedRoute = require('./MatchedRoute');

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
      'requireSession',
      'requireNoSession',
      'requireAdmin'
    ];
    for (let attr of redirect_args) {
      if ((attr in redirects)) {
        const route_name = redirects[attr];
        if (!(route_name in routes)) {
          throw new Error(`No route named ${route_name}`);
        } else {
          this.redirects[attr] = this.routes
        }
      }

    }
  }

  addRoutes (routes) {
    let entries = Object.entries(routes);
    for (const [name, config] of entries) {
      const {path: pattern, page, session, admin} = config;
      const route = new Route({name, pattern, page, session, admin});
      this.routes.push(route);
    }
  }

  getRoutedNamed (name) {
    return this.getRoute({name});
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
  match ({path, route}) {
    console.log('matching', {path, route});
    let {session} = this;
    for (const r of this.routes) {
      try {
        let matched_route = r.match({path, route, session});
        console.log('fuck you stephen', matched_route);
        if (matched_route) {
          return matched_route;
        }
      } catch (error) {
        console.error('match error', error);
        let route, name;
        switch (error) {
          case Errors.RequireNoSession:
            name = this.requireNoSessionRoute;
            route = this.getRoute({name});
          case Errors.RequireSession:
            name = this.requireSessionRoute;
            route = this.getRoute({name});
          case Errors.RequireAdmin:
            name = this.requireAdminRoute;
            route = this.getRoute({name});
          default:
            throw error;
        }

        // TODO: should be MatchedRoute
        return route;
      }
    }

    if (this.notFound) {
      // TODO: handle route vs. path..
      return new MatchedRoute({
        name: 'NotFound',
        page: this.notFound,
        params: {},
        path,
        pattern: null
      });
    } else {
      throw new Error('Route not found');
    }
  }
}

module.exports = Groutcho;
