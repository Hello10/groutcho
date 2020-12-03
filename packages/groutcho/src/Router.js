import type from 'type-of-is';
import {omitter} from '@hello10/util';

import logger from './logger';
import Route from './Route';
import MatchResult from './MatchResult';

const getExtra = omitter(['route', 'url']);

export default class Router {
  constructor ({
    routes,
    redirects,
    max_redirects = 10
  }) {
    this.routes = [];
    this.addRoutes(routes);
    this.max_redirects = max_redirects;

    this.redirects = [];
    for (const [name, test] of Object.entries(redirects)) {
      this.redirects.push({name, test});
    }

    this.listeners = [];
    logger.debug('Constructed router', this);
  }

  addRoutes (routes) {
    const entries = Object.entries(routes);
    for (const [name, config] of entries) {
      config.name = name;
      const route = new Route(config);
      logger.debug('Adding route', route);
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

  getRouteByName (name) {
    const route = this.getRoute({name});
    if (!route) {
      const msg = `No route named ${name}`;
      logger.error(msg);
      throw new Error(msg);
    }
    return route;
  }

  // match
  // -----
  // Checks whether there is a route matching the passed pathname
  // If there is a match, returns the associated Page and matched params.
  // If no match return NotFound
  match (input) {
    input = this.normalizeInput(input);
    const extra = getExtra(input);
    const original = this._match(input);
    const redirect = this._checkRedirects({original, extra});
    logger.debug('match', {input, original, redirect});
    if (redirect) {
      redirect.isRedirect({original});
      return redirect;
    } else {
      return original;
    }
  }

  normalizeInput (input) {
    switch (type(input)) {
      case String:
        if (input.indexOf('/') !== -1) {
          return {url: input};
        } else {
          return {route: {name: input}};
        }
      case Object:
        if (input.name) {
          return {route: input};
        } else {
          return input;
        }
      default: {
        const error = new Error('Invalid input');
        error.input = input;
        throw error;
      }
    }
  }

  _match (input) {
    logger.debug('Attempting to match route', input);
    // if passed full url, treat as redirect
    const {url} = input;
    if (url && url.match(/^https?:\/\//)) {
      return new MatchResult({
        redirect: true,
        input,
        url
      });
    }

    let match = null;
    for (const r of this.routes) {
      match = r.match(input);
      if (match) {
        break;
      }
    }

    return match;
  }

  _checkRedirects ({
    original,
    extra,
    previous = null,
    current = null,
    num_redirects = 0,
    history = []
  }) {
    logger.debug('Checking redirects', {original, extra, previous, current, num_redirects, history});
    const {max_redirects} = this;
    if (num_redirects >= max_redirects) {
      const msg = `Number of redirects exceeded max_redirects (${max_redirects})`;
      logger.error(msg);
      throw new Error(msg);
    }

    function deepEqual (a, b) {
      const {stringify} = JSON;
      return (stringify(a) === stringify(b));
    }

    // if current is the same as original, then we've looped, so this shouldn't
    // be a redirect
    // TODO: improve cycle detection
    if (current && previous) {
      const same_route = (current.route === previous.route);
      const same_params = deepEqual(current.params, previous.params);
      if (same_route && same_params) {
        logger.debug('Route is same as previous', {current, previous});
        return previous;
      }
    }

    if (!current) {
      current = original;
      history = [original];
    }

    if (current.redirect) {
      return current;
    }

    let next = false;
    if (current && current.route.redirect) {
      next = current.route.redirect(current);
    }

    if (!next) {
      for (const {test} of this.redirects) {
        // test returns false if no redirect is needed
        next = test(current);
        if (next) {
          break;
        }
      }
    }

    if (next) {
      logger.debug('Got redirect', {current, next});
      // we got a redirect
      previous = current;
      next = this.normalizeInput(next);
      current = this._match({...next, ...extra});
      if (!current) {
        const error = new Error('No match for redirect result');
        error.redirect = next;
        throw error;
      }
      history.push(current);
      num_redirects++;
      return this._checkRedirects({original, previous, current, num_redirects, history, extra});
    } else if (num_redirects > 0) {
      return current;
    } else {
      return false;
    }
  }

  onGo (listener) {
    this.listeners.push(listener);
  }

  go (input) {
    const match = this.match(input);
    for (const listener of this.listeners) {
      listener(match);
    }
    return match;
  }
}
