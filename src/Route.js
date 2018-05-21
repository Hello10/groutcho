const Url = require('url');
const Querystring = require('querystring');
const pathToRegexp = require('path-to-regexp');

const MatchResult = require('./MatchResult');

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
   * @param {string|string[]} roles - If truthy, require role(s). If non-truthy (default), don't require role.
   */
  constructor ({name, pattern, page, session, role = []}) {
    this.name = name;
    this.pattern = pattern;
    this.page = page;
    this.session = session;
    this.roles = Array.isArray(role) ? role : [role];

    // create matcher for this route (uses path-to-regexp)
    const options = {
      sensitive: false,
      strict: false,
      end: true
    };
    this.param_keys = [];
    this.matcher = pathToRegexp(pattern, this.param_keys, options);
  }

  /**
  * Check whether this route matches a passed path or route.
  * @return {MatchedRoute}
  */
  // you can either pass a path to match
  match ({url, route, session}) {
    let match;
    if (url) {
      match = this._matchUrl(url);
    } else {
      match = this._matchRoute(route);
    }

    if (!match) {
      return false;
    }

    let require_session = false;
    let require_no_session = false;
    let route_session = this.session;
    if (route_session !== undefined) {
      require_session = !!route_session;
      require_no_session = !route_session;
    }

    let require_role = (this.roles.length > 0);
    let has_role = this.roles.some(session.hasRole);

    let redirect = null;
    if (session.signedIn()) {
      if (require_no_session) {
        match.redirect = 'sessionExists';
      }
      if (require_role && !has_role) {
        match.redirect = 'roleMissing';
      }
    } else {
      if (require_session || require_role) {
        match.redirect = 'sessionMissing';
      }
    }

    return match;
  }

  paramNames () {
    return this.param_keys.map((k)=> k.name);
  }

  buildUrl (params = {}) {
    let url = this.buildPath(params);
    const query = this.buildQuery(params);
    if (query.length) {
      url = `${url}?${query}`;
    }
    return url;
  }

  buildPath (params) {
    const {pattern} = this;
    const buildPath = pathToRegexp.compile(pattern);
    return buildPath(params);
  }

  buildQuery (params) {
    const param_names = this.paramNames();

    let query_params = {};
    for (const [name, value] of Object.entries(params)) {
      if (!param_names.includes(name)) {
        query_params[name] = value;
      }
    }

    return Querystring.stringify(query_params);
  }

  _matchUrl (url) {
    const {name, page, pattern} = this;

    const {
      query: query_params,
      pathname: path
    } = Url.parse(url, true);

    const match = this.matcher.exec(path);
    if (!match) {
      return false;
    }

    const route_params = this._getParamsFromMatch(match);
    const params = {...route_params, ...query_params};

    return new MatchResult({
      input: {url},
      match: this,
      params
    });
  }

  // matches if
  // 1) name matches
  // 2) all named params are present
  _matchRoute (route) {
    const {name, params} = route;
    const {pattern, page} = this;

    // Name of passed route must match this route's name
    if (name !== this.name) {
      return false;
    }

    const param_names = this.paramNames();
    const has_all_params = param_names.every((name)=> (name in params));
    if (!has_all_params) {
      return false;
    }

    // All named params are present, its a match
    return new MatchResult({
      input: {route},
      match: this,
      params
    });
  }

  _getParamsFromMatch (match) {
    const params = {};
    const param_names = this.paramNames();

    for (let i = 0; i < param_names.length; i++) {
      // TODO: worth handling delim / repeat?
      const {name, repeat, delimiter} = this.param_keys[i];
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
