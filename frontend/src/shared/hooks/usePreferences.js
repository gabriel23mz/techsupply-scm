import { useContext } from 'react';

import PreferencesContext from '../contexts/preferences-context';

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error(
      'usePreferences debe utilizarse dentro de PreferencesProvider',
    );
  }

  return context;
}

export default usePreferences;
