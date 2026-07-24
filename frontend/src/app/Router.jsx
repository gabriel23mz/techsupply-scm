import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import LoginPage from '../modules/auth/pages/LoginPage';

import {
  navigation,
} from '../shared/constants/navigation.jsx';

import MainLayout from '../shared/layouts/MainLayout';

import ProtectedRoute from './ProtectedRoute';

function Router() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                {navigation.map(
                  (route) => (
                    <Route
                      key={route.path}
                      path={route.path}
                      element={
                        <ProtectedRoute
                          requiredPermission={
                            route.permission
                          }
                        >
                          {route.element}
                        </ProtectedRoute>
                      }
                    />
                  ),
                )}

                <Route
                  path="*"
                  element={
                    <Navigate
                      to="/"
                      replace
                    />
                  }
                />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default Router;
