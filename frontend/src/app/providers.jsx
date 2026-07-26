import {
  BrowserRouter,
} from 'react-router-dom';

import {
  ToastContainer,
} from 'react-toastify';

import {
  AuthProvider,
} from '../shared/contexts/AuthContext';

import {
  PreferencesProvider,
} from '../shared/contexts/PreferencesContext';

import 'react-toastify/dist/ReactToastify.css';
import '../shared/pages/access-pages.css';

function AppProviders({ children }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PreferencesProvider>
          {children}

          <ToastContainer
            position="top-right"
            autoClose={3000}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable
            theme="light"
          />
        </PreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppProviders;
