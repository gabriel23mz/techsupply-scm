import {
  lazy,
  Suspense,
} from 'react';

import {
  Route,
  Routes,
} from 'react-router-dom';

import MainLayout from '../shared/layouts/MainLayout';
import RouteLoadingScreen from '../shared/components/RouteLoadingScreen';

import {
  routeRegistry,
} from '../shared/routing/routeRegistry';

import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';

const LoginPage = lazy(() =>
  import('../modules/auth/pages/LoginPage'),
);

function Router() {
  return (
    <Suspense fallback={<RouteLoadingScreen />}>
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
    </Suspense>
  );
}

export default Router;
