const Url = require('url');
const pathToRegexp = require('path-to-regexp');

const Errors = require('./Errors');
const MatchedRoute = require('./MatchedRoute');

function decodeParam({name, value}) {
  try {
    return decodeURIComponent(value);
  } catch (_) {
    throw new Error(`Invalid value for ${name}`)
  }
}

class Route {
  /**
   * Represents a route
   * @constructor
   * @param {string} name - Name for the route.
   * @param {string} pattern - Pattern used by path-to-regexp to match route.
   * @param {Object} page - Page to be returned along with params for this route.
   * @param {boolean} session - If true, require a session. If false, require no session. If undefined (default), allow either.
   * @param {boolean} admin - If true, require admin session. If non-truthy (default), don't require admin session.
   */
  constructor ({name, pattern, page, session, admin}) {
    this.name = name;
    this.pattern = pattern;
    this.page = page;
    this.session = session;
    this.admin = admin;

    // create matcher for this route (uses path-to-regexp)
    const options = {
      sensitive: false,
      strict: false,
      end: true
    };
    this.paramKeys = [];
    this.matcher = pathToRegexp(pattern, this.paramKeys, options);
  }

  paramNames () {
    return this.paramKeys.map((k)=> k.name);
  }

  /**
  * Check whether this route matches a passed path or route.
  * @return {MatchedRoute}
  */
  // you can either pass a path to match
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
    let require_admin = this.admin;

    let redirect = null;
    if (session.signedIn()) {
      if (require_no_session) {
        throw Errors.RequireNoSession;
      }
      if (require_admin && !session.admin()) {
        throw Errors.RequireAdmin;
      }
    } else {
      if (require_session || require_admin) {
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

    const match = this.matcher.exec(path);
    if (!match) {
      return null;
    }

    const params = this._getParamsFromMatch(match);

    // add query params
    const {query} = Url.parse(path, true);
    for (const [key, value] of Object.entries(query)) {
      if (!(key in params)) {
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

    // Name of passed route must match this route's name
    if (name !== this.name) {
      return null;
    }

    const names = this.paramNames();
    const has_all_params = names.every((name)=> (name in params));
    if (has_all_params) {
      // All named params are present, its a match
      return new MatchedRoute({name, page, params, pattern});
    } else {
      return null;
    }
  }

  _getParamsFromMatch (match) {
    const {paramNames} = this;
    const params = {};

    for (let i = 0; i < paramNames.length; i++) {
      // TODO: worth handling delim / repeat?
      const {name, repeat, delimiter} = paramKeys[i];
      const value = match[i + 1];
      let decoded = decodeParam({name, value});
      if (repeat) {
        decoded = decoded.split(delimiter);
      }
      params[name] = decoded;
    }

    return params;
  }
}

module.exports = Route;
