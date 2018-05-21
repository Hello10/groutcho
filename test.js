const Assert = require('assert');
const Url = require('url');
const Groutcho = require('./src/Groutcho');

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
  }
};

describe('.match', ()=> {
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

    router = new Groutcho({
      session,
      routes,
      notFound: {
        name: 'NotFound',
        page: Page,
        path: '/404'
      },
      redirects: {
        sessionMissing: 'Signin',
        sessionExisting: 'Home',
        roleMissing: 'Home'
      }
    });
  });

  it('should handle missing route', ()=> {
    const match = router.match({
      route: {
        name: 'barf',
        params: {}
      }
    });
    Assert(match.notFound);
    Assert.equal(match.notFound.page, Page);
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
    Assert.equal(match.notFound.page, Page);
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
});
