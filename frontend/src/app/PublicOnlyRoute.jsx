import {
  Navigate,
} from 'react-router-dom';

import SessionLoadingScreen from '../shared/components/SessionLoadingScreen';

import {
  useAuth,
} from '../shared/hooks/useAuth';

import {
  getLandingPath,
} from '../shared/routing/access';

function PublicOnlyRoute({ children }) {
  const {
    isAuthenticated,
    isSessionLoading,
    user,
  } = useAuth();

  if (isSessionLoading) {
    return <SessionLoadingScreen standalone />;
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={getLandingPath(user)}
        replace
      />
    );
  }

  return children;
}

export default PublicOnlyRoute;
