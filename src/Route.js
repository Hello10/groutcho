const Url = require('url');
const RoutePattern = require('route-pattern');

const Errors = require('./Errors');
const MatchedRoute = require('./MatchedRoute');

class Route {
  constructor ({name, path, page, session, admin}) {
    this.name = name;
    this.page = page;
    this.session = session;
    this.admin = admin;
    this.pattern = RoutePattern.fromString(path);
  }

  match ({path, route, session}) {
    let match;
    if (path) {
      match = this._matchPath(path);
    } else {
      match = this._matchRoute(route);
    }

    if (!match) {
      return null;
    }

    let require_session = false;
    let require_no_session = false;
    let route_session = this.session;
    if (route_session !== undefined) {
      require_session = !!route_session;
      require_no_session = !route_session;
    }

    let redirect = null;
    if (session.signedIn()) {
      if (require_no_session) {
        throw Errors.RequireNoSession;
      }
      if (this.admin && !session.admin()) {
        throw Errors.RequireAdmin;
      }
    } else {
      if (require_session || this.admin) {
        throw Errors.RequireSession;
      }
    }

    return match;
  }

  _matchPath (path) {
    const {
      name,
      page,
      pattern
    } = this;

    if (!pattern.matches(path)) {
      return null;
    }

    const params = pattern.match(path).namedParams;

    // add non-path params to the url querystring
    const {query} = Url.parse(path, true);
    for (const [key, value] of Object.entries(query)) {
      const query_has  = (key in query);
      const params_has = (key in params);
      if (query_has && !params_has) {
        params[key] = query[key];
      }
    }

    return new MatchedRoute({name, page, params, pattern});
  }

  // matches if
  // 1) name matches
  // 2) all named params are present
  _matchRoute ({name, params}) {
    const {
      pattern,
      page
    } = this;

    // condition 1
    if (name !== this.name) {
      return null;
    }

    const {
      pathPattern,
      hashPattern,
      queryStringPattern,
    } = pattern;

    let param_names = [...pathPattern.params];

    if (hashPattern) {
      param_names = [...param_names, ...hashPattern.params];
    }

    if (queryStringPattern) {
      let qs_params = queryStringPattern.params.map((p)=> p.name);
      param_names = [...param_names, ...qs_params];
    }

    // condition 2
    const has_all_params = param_names.every((name)=> (name in params));

    if (has_all_params) {
      // All named params are present, its a match
      return new MatchedRoute({name, page, params, pattern});
    } else {
      return null;
    }
  }
}

module.exports = Route;
