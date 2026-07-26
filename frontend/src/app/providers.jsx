import {
  BrowserRouter,
} from 'react-router-dom';

import {
  AuthProvider,
} from '../shared/contexts/AuthContext';

import {
  PreferencesProvider,
} from '../shared/contexts/PreferencesContext';

import ToastViewport from '../shared/ui/ToastViewport/ToastViewport';

import 'react-toastify/dist/ReactToastify.css';
import '../shared/pages/access-pages.css';

function AppProviders({ children }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PreferencesProvider>
          {children}
          <ToastViewport />
        </PreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppProviders;
