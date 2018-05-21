class MatchResult {
  constructor ({
    input,
    match = null,
    params = {},
    notFound = false,
    redirect = null,
    url = null
  }) {
    this.input = input;
    this.match = match;
    this.params = params;
    this.notFound = notFound;
    this.redirect = redirect;

    if (!url && match) {
      url = match.buildUrl(params);
    }
    this.url = url;
  }
}

module.exports = MatchResult;
