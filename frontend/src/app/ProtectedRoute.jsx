import {
  Navigate,
  useLocation,
} from 'react-router-dom';

import SessionLoadingScreen from '../shared/components/SessionLoadingScreen';

import {
  useAuth,
} from '../shared/hooks/useAuth';

import {
  usePermissions,
} from '../shared/hooks/usePermissions';

function ProtectedRoute({
  access,
  children,
}) {
  const location = useLocation();

  const {
    isAuthenticated,
    isSessionLoading,
  } = useAuth();

  const {
    canAccess,
  } = usePermissions();

  if (isSessionLoading) {
    return <SessionLoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        }}
      />
    );
  }

  if (!canAccess(access)) {
    return (
      <Navigate
        to="/acceso-denegado"
        replace
        state={{
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;
