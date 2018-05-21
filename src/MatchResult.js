class MatchResult {
  constructor ({
    input,
    route = null,
    params = {},
    notFound = false,
    redirect = null,
    url = null
  }) {
    this.input = input;
    this.route = route;
    this.params = params;
    this.notFound = notFound;
    this.redirect = redirect;

    if (!url && route) {
      url = route.buildUrl(params);
    }
    this.url = url;
  }
}

module.exports = MatchResult;
