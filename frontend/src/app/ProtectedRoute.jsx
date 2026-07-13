import {
  Navigate,
  useLocation,
} from 'react-router-dom';

import {
  useAuth,
} from '../shared/contexts/AuthContext';

function ProtectedRoute({ children }) {
  const location = useLocation();

  const {
    isAuthenticated,
  } = useAuth();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;
