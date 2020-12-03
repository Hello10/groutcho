(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react'), require('groutcho'), require('prop-types')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react', 'groutcho', 'prop-types'], factory) :
  (global = global || self, factory(global.groutchoReact = {}, global.react, global.groutcho, global.propTypes));
}(this, (function (exports, React, groutcho, PropTypes) {
  PropTypes = PropTypes && Object.prototype.hasOwnProperty.call(PropTypes, 'default') ? PropTypes['default'] : PropTypes;

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

  const RouterContext = React.createContext();

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

    const [url, setUrl] = React.useState(getUrl());
    const router = React.useMemo(() => {
      const router = new groutcho.Router({
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
    React.useEffect(() => {
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
    const router = React.useContext(RouterContext);
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
    return /*#__PURE__*/React.createElement(RouterContext.Provider, {
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

  exports.RouterContainer = RouterContainer;
  exports.RouterContext = RouterContext;
  exports.useGo = useGo;
  exports.useRouter = useRouter;

})));
//# sourceMappingURL=index.umd.js.map
