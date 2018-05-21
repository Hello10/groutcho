const Assert = require('assert');
const Url = require('url');
const Groutcho = require('./index');

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
    admin: true
  }
};

describe('.match', ()=> {
  let router;
  let signedIn;
  let admin;

  const session = {
    signedIn: ()=> {
      return signedIn;
    },
    admin: ()=> {
      return admin;
    }
  }

  beforeEach(()=> {
    signedIn = true;
    admin = false;

    router = new Groutcho({
      routes,
      session,
      notFound: {
        page: Page,
        path: '/404'
      },
      redirects: {
        requireSession: 'Signin',
        requireNoSession: 'Home',
        requireAdmin: 'Home'
      }
    });
  });

  it('should handle missing route', ()=> {
    const result = router.match({
      route: {
        name: 'barf',
        params: {}
      }
    });
    Assert(result.notFound);
    Assert.equal(result.match.name, 'NotFound');
    Assert.equal(result.match.page, Page);
  });

  it('should handle missing param', ()=> {
    const result = router.match({
      route: {
        name: 'OneParam',
        params: {
          barf: 'barf'
        }
      }
    });
    Assert(result.notFound);
    Assert.equal(result.match.name, 'NotFound');
    Assert.equal(result.match.page, Page);
  });

  it('should handle empty route', ()=> {
    const result = router.match({
      route: {
        name: 'Home',
        params: {}
      }
    });
    Assert(result.match);
    Assert.equal(result.match.name, 'Home');
    Assert.equal(result.url, '/');
  });

  it('should handle matched path route', ()=> {
    const original = '/show/derp';
    const result = router.match({
      url: original
    });
    Assert(result.match);
    Assert.equal(result.match.name, 'OneParam');
    Assert.equal(result.url, original);
  });

  it('should handle no param route', ()=> {
    const result = router.match({
      route: {
        name: 'NoParams',
        params: {}
      }
    });
    Assert(result.match);
    Assert.equal(result.match.name, 'NoParams');
    Assert.equal(result.url, '/show');
  });

  it('should handle one param route', ()=> {
    const result = router.match({
      route: {
        name: 'OneParam',
        params: {
          title: 'barf'
        }
      }
    });

    Assert(result.match);
    Assert.equal(result.match.name, 'OneParam');
    Assert.equal(result.url, '/show/barf');
  });

  it('should handle extra params by adding them to the query', ()=> {
    const result = router.match({
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

    Assert(result.match);
    const parsed = Url.parse(result.url, true);
    Assert.equal(parsed.pathname, '/show/d/barf/b');
    Assert.deepEqual(parsed.query, {
      donk: 'ed',
      honk: 'y'
    });
  });

  it('should handle extra query params by keeping them in the query', ()=> {
    const show = '/show?derp=true';
    let result = router.match({
      url: show
    });

    Assert(result.match);
    Assert.equal(result.url, show);

    const show_barf = '/show/honk?barf=pizza&derp=true&honk=10';
    result = router.match({
      url: show_barf
    });

    Assert(result.match);
    Assert.equal(result.url, show_barf);
  });

  it('should handle redirecting when session is required', ()=> {
    signedIn = false;
    let result = router.match({
      url: '/dashboard'
    });
    Assert(result.match);
    Assert(result.redirect);
    Assert.equal(result.url, '/signin');
  });

  it('should handle redirecting when no session is required', ()=> {
    signedIn = true;
    let result = router.match({
      url: '/signin'
    });
    Assert(result.match);
    Assert(result.redirect);
    Assert.equal(result.url, '/');
  });

  it('should handle redirecting when admin is required', ()=> {
    admin = false;
    let result = router.match({
      url: '/admin/derp'
    });
    Assert(result.match);
    Assert(result.redirect);
    Assert.equal(result.url, '/');
  });

  it('should handle redirecting when admin is required and no session', ()=> {
    signedIn = false;
    admin = false;
    let result = router.match({
      url: '/admin/derp'
    });
    Assert(result.match);
    Assert(result.redirect);
    Assert.equal(result.url, '/signin');
  });
});
