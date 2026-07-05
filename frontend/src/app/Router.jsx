import { Route, Routes } from 'react-router-dom';

import { navigation } from '../shared/constants/navigation.jsx';
import MainLayout from '../shared/layouts/MainLayout';

function Router() {
  return (
    <MainLayout>
      <Routes>
        {navigation.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={route.element}
          />
        ))}
      </Routes>
    </MainLayout>
  );
}

export default Router;


