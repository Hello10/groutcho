class MatchResult {
  constructor ({
    input,
    route = null,
    params = {},
  }) {
    this.input = input;
    this.route = route;
    this.params = params;
    this.redirect = false;
    this.original = null;
    this.url = route.buildUrl(params);
  }

  isRedirect ({original}) {
    this.redirect = true;
    this.original = original;
  }
}

module.exports = MatchResult;
