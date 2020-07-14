const Assert = require('assert');
const Url = require('url');
const {Router, Route} = require('./dist');

function Page () {}

const routes = {
  Home: {
    pattern: '/',
    page: Page,
    session: true
  },
  NoParams: {
    pattern: '/show',
    page: Page
  },
  OneParam: {
    pattern: '/show/:title',
    page: Page
  },
  TwoParam: {
    pattern: '/show/:foo/barf/:barf',
    page: Page
  },
  OptionalParam: {
    pattern: '/optional/:optional?',
    page: Page
  },
  Signin: {
    pattern: '/signin',
    page: Page,
    session: false
  },
  Dashboard: {
    pattern: '/dashboard',
    page: Page,
    session: true
  },
  AdminDerp: {
    pattern: '/admin/derp',
    page: Page,
    role: 'admin'
  },
  NotFound: {
    pattern: '/404',
    page: Page
  },
  Multi1: {
    pattern: '/multi1',
    page: Page
  },
  Multi2: {
    pattern: '/multi2',
    page: Page
  },
  Multi3: {
    pattern: '/multi3',
    page: Page
  },
  Self: {
    pattern: '/self',
    page: Page
  },
  HasRedirect: {
    pattern: '/redirect/:derp',
    page: Page,
    redirect ({params}) {
      return (params.derp === 'randyquaid') ? false : 'Home';
    }
  },
  InputRedirect: {
    pattern: '/inputredirect',
    page: Page,
    redirect ({input}) {
      return input.homer ? 'InputRedirect2' : false;
    }
  },
  InputRedirect2: {
    pattern: '/inputredirect2',
    page: Page,
    redirect ({input}) {
      return input.homer ? 'Home' : false;
    }
  },
  Endless: {
    pattern: '/endless/:count?',
    page: Page,
    redirect ({params}) {
      const {count = 0} = params;
      return `/endless/${count + 1}`;
    }
  },
  BadRedirect: {
    pattern: '/badredirect',
    page: Page,
    redirect () {
      return '/thisdoesnotexistok';
    }
  }
};

describe('groutcho', ()=> {
  describe('Route', ()=> {
    describe('constructor', ()=> {
      it('should require all route params', ()=> {
        Assert.throws(()=> {
          const route = new Route({
            name: 'wow',
            pattern: '/'
          });
          Assert(!route);
        });
      });

      it('should error on specfic method name route params', ()=> {
        Assert.throws(()=> {
          const route = new Route({
            name: 'wow',
            pattern: '/',
            page: function Page () {},
            match: 'derp'
          });
          Assert(!route);
        });
      });
    });

    describe('.is', ()=> {
      it('should test match', ()=> {
        const route = new Route({
          name: 'Derp',
          pattern: '/derp/:derp',
          page: function Page () {}
        });
        Assert(route.is('/derp/wow'));
        Assert(route.is('Derp'));
        Assert(!route.is('Woof'));
        Assert(!route.is('/dooof'));
      });
    });
  });

  describe('Router', ()=> {
    let router;
    let signedIn;
    let role;

    const session = {
      signedIn: ()=> {
        return signedIn;
      },
      hasRole: (r)=> {
        return (r === role);
      }
    };

    beforeEach(()=> {
      signedIn = true;
      role = null;

      router = new Router({
        routes,
        redirects: {
          NotFound: (match)=> {
            return match ? false : 'NotFound';
          },
          Session: ({route})=> {
            const has_session = (route.session !== undefined);
            const require_session = (has_session && route.session);
            const require_no_session = (has_session && !route.session);
            const signed_in = session.signedIn();
            if (require_session && !signed_in) {
              return 'Signin';
            }
            if (require_no_session && signed_in) {
              return 'Home';
            }
            return false;
          },
          Role: ({route})=> {
            const {role} = route;
            const shouldRedirect = (role && !session.hasRole(role));
            return shouldRedirect ? 'Home' : false;
          },
          Multi: ({route})=> {
            // force multiple weird redirects
            const isMulti = /Multi/;
            const {name} = route;
            if (!name.match(isMulti)) {
              return false;
            }
            let num = parseInt(name.replace(isMulti, ''), 10);
            if (num < 3) {
              num++;
              return `Multi${num}`;
            } else {
              return false;
            }
          },
          Self: ({route})=> {
            if (route.name === 'Self') {
              return 'Self';
            } else {
              return false;
            }
          }
        }
      });
    });

    describe('.getRouteByName', ()=> {
      it('should get a route by name', ()=> {
        const name = 'TwoParam';
        const route = router.getRouteByName(name);
        Assert.equal(route.name, name);
      });

      it('should throw on missing route', ()=> {
        Assert.throws(()=> {
          router.getRouteByName('MissingAndPresumedScared');
        });
      });
    });

    describe('.match', ()=> {
      it('should throw on bad input format', ()=> {
        Assert.throws(()=> {
          router.match(10);
        }, /Invalid input/);
      });

      it('should handle missing route', ()=> {
        const match = router.match({
          route: {
            name: 'barf',
            params: {}
          }
        });
        Assert(match.redirect);
        Assert.equal(match.url, '/404');
      });

      it('should handle missing param', ()=> {
        const match = router.match({
          route: {
            name: 'OneParam',
            params: {
              barf: 'barf'
            }
          }
        });
        Assert(match.redirect);
        Assert.equal(match.url, '/404');
      });

      it('should handle empty route', ()=> {
        const match = router.match({
          route: {
            name: 'Home',
            params: {}
          }
        });
        Assert(match.route);
        Assert(!match.redirect);
        Assert.equal(match.route.name, 'Home');
        Assert.equal(match.url, '/');
      });

      it('should handle matched path route', ()=> {
        const original = '/show/derp';
        const match = router.match({
          url: original
        });
        Assert(match.route);
        Assert(!match.redirect);
        Assert.equal(match.route.name, 'OneParam');
        Assert.equal(match.url, original);
      });

      it('should handle no param route', ()=> {
        const match = router.match({
          route: {
            name: 'NoParams',
            params: {}
          }
        });
        Assert(match.route);
        Assert(!match.redirect);
        Assert.equal(match.route.name, 'NoParams');
        Assert.equal(match.url, '/show');
      });

      it('should handle one param route', ()=> {
        const match = router.match({
          route: {
            name: 'OneParam',
            params: {
              title: 'barf'
            }
          }
        });

        Assert(match.route);
        Assert(!match.redirect);
        Assert.equal(match.route.name, 'OneParam');
        Assert.equal(match.url, '/show/barf');
      });

      it('should handle optional params', ()=> {
        let match = router.match('/optional');
        Assert(match.route);
        Assert(!match.params.optional);

        match = router.match({
          route: {
            name: 'OptionalParam'
          }
        });
        Assert(match.route);

        match = router.match('/optional/barf');
        Assert(match.route);
        Assert(!match.redirect);
        Assert.equal(match.params.optional, 'barf');
      });

      it('should handle extra params by adding them to the query', ()=> {
        const match = router.match({
          route: {
            name: 'TwoParam',
            params: {
              foo: 'd',
              barf: 'b',
              donk: 'ed',
              honk: 'y'
            }
          }
        });

        Assert(match.route);
        Assert(!match.redirect);
        const parsed = Url.parse(match.url, true);
        Assert.equal(parsed.pathname, '/show/d/barf/b');
        Assert.deepEqual(parsed.query, {
          donk: 'ed',
          honk: 'y'
        });
      });

      it('should handle extra query params by keeping them in the query', ()=> {
        const show = '/show?derp=true';
        let match = router.match({
          url: show
        });

        Assert(match.route);
        Assert(!match.redirect);
        Assert.equal(match.url, show);

        const show_barf = '/show/honk?barf=pizza&derp=true&honk=10';
        match = router.match({
          url: show_barf
        });

        Assert(match.route);
        Assert.equal(match.url, show_barf);
      });

      it('should handle repeated query params', ()=> {
        const show = '/show?derp=1&derp=2';
        const match = router.match({
          url: show
        });

        Assert(match.route);
        Assert(!match.redirect);
        Assert.deepEqual(match.params.derp, [1, 2]);
        Assert.equal(match.url, show);
      });

      it('should handle redirecting when session is required', ()=> {
        signedIn = false;
        const match = router.match({
          url: '/dashboard'
        });
        Assert(match.route);
        Assert(match.redirect);
        Assert.equal(match.url, '/signin');
      });

      it('should handle redirecting when no session is required', ()=> {
        signedIn = true;
        const match = router.match({
          url: '/signin'
        });
        Assert(match.route);
        Assert(match.redirect);
        Assert.equal(match.url, '/');
      });

      it('should throw on endless redirect loop', ()=> {
        Assert.throws(()=> {
          router.match('/endless');
        }, /Number of redirects exceeded/);
      });

      it('should handle bad redirect', ()=> {
        Assert.throws(()=> {
          router.match('/badredirect');
        }, /No match for redirect result/);
      });

      it('should handle custom redirects and no session', ()=> {
        signedIn = false;
        role = null;
        const match = router.match({
          url: '/admin/derp'
        });
        Assert(match.route);
        Assert(match.redirect);
        Assert.equal(match.url, '/signin');
      });

      it('should handle custom redirects when no redirect needed', ()=> {
        signedIn = true;
        role = 'admin';
        const derp = '/admin/derp';
        const match = router.match({
          url: derp
        });
        Assert(match.route);
        Assert(!match.redirect);
        Assert.equal(match.url, derp);
      });

      it('should handle custom redirects when redirect needed', ()=> {
        signedIn = true;
        role = 'user';
        const match = router.match({
          url: '/admin/derp'
        });
        Assert(match.route);
        Assert(match.redirect);
        Assert.equal(match.url, '/');
      });

      it('should handle multiple redirects', ()=> {
        const url = '/multi1';
        const match = router.match({url});
        Assert(match.redirect);
        Assert.equal(match.url, '/multi3');
      });

      it('should not redirect to self indefinitely', ()=> {
        const url = '/self';
        const match = router.match({url});
        Assert(match.redirect);
        Assert(match.url === url);
      });

      it('should handle string arg as url', ()=> {
        const match = router.match('/');
        Assert(match.route);
        Assert(!match.redirect);
        Assert.equal(match.route.name, 'Home');
        Assert.equal(match.url, '/');
      });

      it('should handle string arg as absolute url', ()=> {
        const wonky = 'http://wonky.gov';
        const match = router.match(wonky);
        Assert(match.redirect);
        Assert.equal(match.route, null);
        Assert.equal(match.url, wonky);
      });

      it('should handle string arg as route name', ()=> {
        const match = router.match('Home');
        Assert(match.route);
        Assert(!match.redirect);
        Assert.equal(match.route.name, 'Home');
        Assert.equal(match.url, '/');
      });

      it('should handle object arg with name property as route', ()=> {
        const match = router.match({name: 'Home'});
        Assert(match.route);
        Assert(!match.redirect);
        Assert.equal(match.route.name, 'Home');
        Assert.equal(match.url, '/');
      });

      it('should handle redirect defined within route', ()=> {
        let url = '/redirect/randyquaid';
        let match = router.match(url);
        Assert(match.route);
        Assert.equal(match.route.name, 'HasRedirect');
        Assert(!match.redirect);
        Assert.equal(match.url, url);

        url = '/redirect/dennisquaid';
        match = router.match(url);
        Assert(match.redirect);
        Assert.equal(match.url, '/');
      });

      it('should handle input redirect check', ()=> {
        const url = '/inputredirect';
        let match = router.match({url});
        Assert(match.route);
        Assert.equal(match.route.name, 'InputRedirect');
        Assert(!match.redirect);
        Assert.equal(match.url, url);

        const homer = 'Simpson';
        match = router.match({url, homer});
        Assert(match.route);
        Assert.equal(match.route.name, 'Home');
        Assert(match.redirect);
        Assert.equal(match.original.input.homer, homer);
      });
    });

    describe('.go', ()=> {
      let went;
      let match;

      beforeEach(()=> {
        went = false;
        match = null;
        router.onGo((m)=> {
          went = true;
          match = m;
        });
      });

      it('should handle calling listeners when route changes', ()=> {
        const showderp = '/show/derp';
        router.go({url: showderp});
        Assert(went);
        Assert.equal(match.url, showderp);
      });

      it('should handle missing route', ()=> {
        router.go({url: '/derp/derp'});
        Assert(went);
        Assert(match.redirect);
        Assert.equal(match.url, '/404');
      });

      it('should handle redirect', ()=> {
        signedIn = false;
        router.go({url: '/dashboard'});
        Assert(match.redirect);
        Assert.equal(match.url, '/signin');
      });

      it('should handle url', ()=> {
        const quaid = 'https://quaid.gov';
        router.go({url: quaid});
        Assert(went);
        Assert.equal(match.url, quaid);
      });
    });
  });
});
