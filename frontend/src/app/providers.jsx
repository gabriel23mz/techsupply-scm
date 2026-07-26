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

import {
  usePreferences,
} from '../shared/hooks/usePreferences';

import 'react-toastify/dist/ReactToastify.css';
import '../shared/pages/access-pages.css';

function ThemedToastContainer() {
  const {
    resolvedTheme,
  } = usePreferences();

  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
      theme={resolvedTheme}
      limit={4}
    />
  );
}

function AppProviders({ children }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PreferencesProvider>
          {children}
          <ThemedToastContainer />
        </PreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppProviders;
