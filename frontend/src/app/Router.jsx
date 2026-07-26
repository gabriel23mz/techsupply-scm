import {
  Route,
  Routes,
} from 'react-router-dom';

import LoginPage from '../modules/auth/pages/LoginPage';

import MainLayout from '../shared/layouts/MainLayout';

import {
  routeRegistry,
} from '../shared/routing/routeRegistry';

import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';

function Router() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                {routeRegistry.map((route) => (
                  <Route
                    key={route.id}
                    path={route.path}
                    element={
                      <ProtectedRoute
                        access={route.access}
                      >
                        {route.element}
                      </ProtectedRoute>
                    }
                  />
                ))}
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default Router;
