const Url = require('url');
const pathToRegexp = require('path-to-regexp');

class MatchedRoute {
  constructor ({name, page, params, pattern, path}) {
    console.log('donkey',{name, page, params, pattern, path});
    this.page = page;
    this.name = name;
    this.params = params;
    this.pattern = pattern;
    this.path = path ? path : this.buildPath();
  }

  buildPath () {
    const {pattern, params} = this;
    console.log('fuck', {pattern, params});
    const buildPath = pathToRegexp.compile(pattern);
    return buildPath(params);
  }
}

module.exports = MatchedRoute;
