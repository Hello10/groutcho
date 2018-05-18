const Url = require('url');

class MatchedRoute {
  constructor ({name, params, pattern}) {
    this.name = name;
    this.params = params;
    this.pattern = pattern;
    this.path = this.buildPath();
  }

  buildPath () {
    const {pattern} = this;

    // clone params for building the path non-destructively
    // since it modifies the params
    const params = Object.assign({}, this.params);

    function substituteNamedParam ({str, name}) {
      const placeholder = `:${name}`;
      const value = params[name];
      str = str.replace(placeholder, value);
      delete params[name];
      return str;
    }

    // build the path part
    let path = pattern.pathPattern.routeString;
    const path_param_names = pattern.pathPattern.params;
    for (let name of path_param_names) {
      path = substituteNamedParam({
        str: path,
        name
      });
    }

    // build the hash part
    let hash = null;
    if (pattern.hashPattern) {
      const hash_param_names = pattern.hashPattern.params;
      hash = pattern.hashPattern.routeString;
      for (let name of hash_param_names) {
        hash = substituteNamedParam({
          str: hash,
          name
        });
      }
    }

    // query string is built from any remaining parameters that weren't
    // named path or has params
    const url_params = {
      pathname: path,
      query: params
    }

    if (hash) {
      url_params.hash = hash;
    }

    return Url.format(url_params);
  }
}

module.exports = MatchedRoute;
