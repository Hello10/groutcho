const Assert = require('assert');
const Url = require('url');
const Groutcho = require('./Groutcho');

function Page () {}

const routes = {
  Home: {
    path: '/',
    page: Page
  },
  Signin: {
    path: '/signin',
    page: Page
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
    path: '/show?barf=:barf',
    page: Page
  },
  OverlyComplicated: {
    path: '/hello/:planet?foo=:foo&fruit=:fruit#:section',
    page: Page
  }
};

describe('.match', ()=> {
  let router;
  let signedIn = true;
  let admin = false;
  const session = {
    signedIn: ()=> {
      return signedIn;
    },
    admin: ()=> {
      return admin;
    }
  }

  beforeEach(()=> {
    router = new Groutcho({
      routes,
      session,
      notFoundPage: Page,
      requireSessionRoute: 'Signin',
      requireNoSessionRoute: 'Home',
      requireAdminRoute: 'Home',
    });
  });

  it('should handle missing route', ()=> {
    const match = router.match({
      route: {
        name: 'barf',
        params: {}
      }
    });
    Assert.equal(match.name, 'NotFound');
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

    Assert.equal(match.name, 'NotFound');
  });

  it('should handle matched path route', ()=> {
    const original = '/show/derp';
    const match = router.match({
      path: original
    });
    Assert.equal(match.path, original);
  });

  it('should handle empty route', ()=> {
    const match = router.match({
      route : {
        name   : 'Home',
        params : {}
      }
    });
    Assert.equal(match.path, '/');
  });

  it('should handle no param route', ()=> {
    const match = router.match({
      route : {
        name   : 'NoParams',
        params : {}
      }
    });
    Assert.equal(match.path, '/show');
  });

  it('should handle one param route', ()=> {
    const match = router.match({
      route : {
        name   : 'OneParam',
        params : {
          title : 'barf'
        }
      }
    });
    Assert.equal(match.path, '/show/barf');
  });

  it('overly complicated route', ()=> {
    const match = router.match({
      route : {
        name   : 'OverlyComplicated',
        params : {
          planet  : 'earth',
          fruit   : 'bythefoot',
          section : 'barf',
          foo     : 'd'
        }
      }
    });

    const parsed = Url.parse(match.path, true);
    Assert.equal(parsed.pathname, '/hello/earth');
    Assert.equal(parsed.hash, '#barf');
    Assert.deepEqual(parsed.query, {
      foo   : 'd',
      fruit :'bythefoot'
    });
  });

  it('should handle extra params by adding them to the query', ()=> {
    const match = router.match({
      route : {
        name   : 'OverlyComplicated',
        params : {
          planet  : 'earth',
          foo     : 'd',
          barf    : 'b',
          fruit   : 'bythefoot',
          section : 'barf'
        }
      }
    });

    parsed = Url.parse(match.path, true);
    Assert.equal(parsed.pathname, '/hello/earth');
    Assert.equal(parsed.hash, '#barf');
    Assert.deepEqual(parsed.query, {
      foo   : 'd',
      fruit : 'bythefoot',
      barf  : 'b'
    });
  });

  it('should handle extra query params by keeping them in the query', ()=> {
    const show = '/show?derp=true';
    let match = router.match({
      path : show
    });

    Assert.equal(match.path, show);

    const show_barf = '/show?barf=pizza&derp=true&honk=10';
    match = router.match({
      path : show_barf
    });

    Assert.equal(match.path, show_barf);
  });
});
