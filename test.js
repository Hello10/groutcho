const Assert = require('assert');
const Url = require('url');
const Router = require('./src/Router');

function Page () {}

const routes = {
  Home: {
    path: '/',
    page: Page,
  },
  NoParams: {
    path: '/show',
    page: Page
  },
  OneParam: {
    path: '/show/:title',
    page: Page
  },
  TwoParam: {
    path: '/show/:foo/barf/:barf',
    page: Page
  },
  OptionalParam: {
    path: '/optional/:optional?',
    page: Page
  },
  Signin: {
    path: '/signin',
    page: Page,
    session: false
  },
  Dashboard: {
    path: '/dashboard',
    page: Page,
    session: true
  },
  AdminDerp: {
    path: '/admin/derp',
    page: Page,
    role: 'admin'
  },
  NotFound: {
    path: '/404',
    page: Page
  }
};

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
  }

  beforeEach(()=> {
    signedIn = true;
    role = null;

    router = new Router({
      session,
      routes,
      redirects: {
        notFound: 'NotFound',
        sessionMissing: 'Signin',
        sessionExisting: 'Home',
        roleMissing: 'Home'
      }
    });
  });

  describe('.match', ()=> {
    it('should handle missing route', ()=> {
      const match = router.match({
        route: {
          name: 'barf',
          params: {}
        }
      });
      Assert(match.notFound);
      Assert.equal(match.redirect.page, Page);
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
      Assert(match.notFound);
      Assert.equal(match.redirect.page, Page);
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
      Assert.equal(match.route.name, 'Home');
      Assert.equal(match.url, '/');
    });

    it('should handle matched path route', ()=> {
      const original = '/show/derp';
      const match = router.match({
        url: original
      });
      Assert(match.route);
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
      Assert.equal(match.route.name, 'OneParam');
      Assert.equal(match.url, '/show/barf');
    });

    it('should handle optional params', ()=> {
      let match = router.match('/optional');
      Assert(match.route);
      Assert(!('optional' in match.params));

      match = router.match('/optional/barf');
      Assert(match.route);
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
      Assert.equal(match.url, show);

      const show_barf = '/show/honk?barf=pizza&derp=true&honk=10';
      match = router.match({
        url: show_barf
      });

      Assert(match.route);
      Assert.equal(match.url, show_barf);
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

    it('should handle redirecting when role is required', ()=> {
      signedIn = true;
      role = 'user';
      const match = router.match({
        url: '/admin/derp'
      });
      Assert(match.route);
      Assert(match.redirect);
      Assert.equal(match.url, '/');
    });

    it('should handle redirecting when role is required and no session', ()=> {
      signedIn = false;
      role = null;
      const match = router.match({
        url: '/admin/derp'
      });
      Assert(match.route);
      Assert(match.redirect);
      Assert.equal(match.url, '/signin');
    });

    it('should handle admin route when role is admin', ()=> {
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

    it('should handle string arg as url', ()=> {
      const match = router.match('/');
      Assert(match.route);
      Assert.equal(match.route.name, 'Home');
      Assert.equal(match.url, '/');
    });

    it('should handle object arg with name property as route', ()=> {
      const match = router.match({name: 'Home'});
      Assert(match.route);
      Assert.equal(match.route.name, 'Home');
      Assert.equal(match.url, '/');
    });
  });

  describe('.go', ()=> {
    let derp;
    let url;

    beforeEach(()=> {
      derp = false;
      url = null;
      router.onChange((earl)=> {
        derp = true;
        url = earl;
      })
    });

    it('should handle calling listeners when route changes', ()=> {
      const showderp = '/show/derp';
      router.go({url: showderp});
      Assert(derp);
      Assert.equal(url, showderp);
    });

    it('should handle missing route', ()=> {
      router.go({url: '/derp/derp'});
      Assert(derp);
      Assert.equal(url, '/404');
    });
  })
});
