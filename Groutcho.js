const Route = require('./Route');
const Errors = require('./Errors');

class Groutcho {
  constructor ({
    routes,
    session,
    notFoundPage,
    requireSessionRoute,
    requireNoSessionRoute,
    requireAdminRoute
  }) {
    this.routes = [];
    this.addRoutes(routes);
    this.session = session;
    this.notFound = notFoundPage;

    this.requireSessionRoute = requireSessionRoute;
    this.requireNoSessionRoute = requireNoSessionRoute;
    this.requireAdminRoute = requireAdminRoute;

    let checks = [
      'requireSessionRoute',
      'requireNoSessionRoute',
      'requireAdminRoute'
    ];
    for (let attr of checks) {
      const route_name = this[attr];
      if (route_name && !(route_name in routes)) {
        throw new Error(`No route named ${route_name}`);
      }
    }
  }

  addRoutes (routes) {
    let entries = Object.entries(routes);
    for (const [name, {path, page, session}] of entries) {
      const route = new Route({path, page, session, name});
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
  match ({path, route}) {
    let {session} = this;
    for (const r of this.routes) {
      try {
        let matched_route = r.match({path, route, session});
        if (matched_route) {
          return matched_route;
        }
      } catch (error) {
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

    return {
      page: this.NotFound,
      params: route.params,
      path,
      name: 'NotFound'
    }
  }
}

module.exports = Groutcho;
