import * as React from 'react';
import {
  useContext,
  useMemo,
  useEffect,
  useState
} from 'react';
import {Router} from 'groutcho';

const RouterContext = React.createContext();

function useRouter ({input, routes, redirects, web, onChange}) {
  function getUrl () {
    if (web) {
      const {location} = window;
      const {pathname, search} = location;
      return `${pathname}${search}`;
    } else {
      return '/';
    }
  }

  function setUrlAndPushState (url) {
    setUrl(url);
    if (web) {
      window.history.pushState({}, '', url);
    }
  }

  const [url, setUrl] = useState(getUrl());
  const router = useMemo(()=> {
    const router = new Router({routes, redirects});
    router.onChange((new_url)=> {
      if (new_url !== url) {
        setUrlAndPushState(new_url);
        if (onChange) {
          onChange(url);
        }
      }
    }, input);
    return router;
  });

  useEffect(()=> {
    if (!web) {
      return ()=> {};
    }

    function onPopState () {
      setUrl(url);
    }

    window.addEventListener('popstate', onPopState);
    return ()=> {
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  const match = router.match({...input, url});
  if (match.redirect) {
    setUrlAndPushState(match.url);
  }

  return {
    match,
    router,
    url
  };
}

function useGo () {
  const router = useContext(RouterContext);
  return function go (args) {
    return router.go(args);
  };
}

export {
  RouterContext,
  useRouter,
  useGo
};
