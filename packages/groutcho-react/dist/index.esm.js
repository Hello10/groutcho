import { createContext, useState, useMemo, useEffect, useContext, createElement } from 'react';
import { Router } from 'groutcho';
import PropTypes from 'prop-types';

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

const RouterContext = createContext();

function useRouter({
  input,
  routes,
  redirects,
  web,
  onGo
}) {
  function getUrl() {
    if (web) {
      const {
        location
      } = window;
      const {
        pathname,
        search
      } = location;
      return `${pathname}${search}`;
    } else {
      return '/';
    }
  }

  function setUrlAndPushState(url) {
    setUrl(url);

    if (web) {
      window.history.pushState({}, '', url);
    }
  }

  const [url, setUrl] = useState(getUrl());
  const router = useMemo(() => {
    const router = new Router({
      routes,
      redirects
    });
    router.onGo(new_url => {
      if (new_url !== url) {
        setUrlAndPushState(new_url);

        if (onGo) {
          onGo(url);
        }
      }
    }, input);
    return router;
  });
  useEffect(() => {
    if (!web) {
      return () => {};
    }

    function onPopState() {
      setUrl(url);
    }

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, []);
  const match = router.match(_extends({}, input, {
    url
  }));

  if (match.redirect) {
    setUrlAndPushState(match.url);
  }

  return {
    match,
    router,
    url
  };
}

function useGo() {
  const router = useContext(RouterContext);
  return function go(args) {
    return router.go(args);
  };
}

function RouterContainer({
  input,
  routes,
  redirects,
  children,
  web,
  onGo
}) {
  const {
    router,
    match
  } = useRouter({
    input,
    routes,
    redirects,
    web,
    onGo
  });
  return /*#__PURE__*/createElement(RouterContext.Provider, {
    value: router
  }, children({
    match
  }));
}
RouterContainer.propTypes = {
  input: PropTypes.object,
  routes: PropTypes.object,
  redirects: PropTypes.object,
  web: PropTypes.bool,
  children: PropTypes.func,
  onGo: PropTypes.func
};

export { RouterContainer, RouterContext, useGo, useRouter };
//# sourceMappingURL=index.esm.js.map
