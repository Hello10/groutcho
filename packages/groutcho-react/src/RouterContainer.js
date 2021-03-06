import * as React from 'react';
import PropTypes from 'prop-types';

import {
  RouterContext,
  useRouter
} from './Hooks';

export default function RouterContainer ({input, routes, redirects, children, web, onGo}) {
  const {router, match} = useRouter({input, routes, redirects, web, onGo});
  return (
    <RouterContext.Provider value={router}>
      {children({match})}
    </RouterContext.Provider>
  );
}

RouterContainer.propTypes = {
  input: PropTypes.object,
  routes: PropTypes.object,
  redirects: PropTypes.object,
  web: PropTypes.bool,
  children: PropTypes.func,
  onGo: PropTypes.func
};
