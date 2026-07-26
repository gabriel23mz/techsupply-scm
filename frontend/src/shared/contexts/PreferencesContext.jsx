import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import PreferencesContext from './preferences-context';

const STORAGE_KEY =
  'techsupply_preferences';

const DEFAULT_PREFERENCES = {
  sidebarCollapsed: false,
  compactContent: false,
};

function readPreferences() {
  try {
    const stored = localStorage.getItem(
      STORAGE_KEY,
    );

    return stored
      ? {
        ...DEFAULT_PREFERENCES,
        ...JSON.parse(stored),
      }
      : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function PreferencesProvider({
  children,
}) {
  const [
    preferences,
    setPreferences,
  ] = useState(readPreferences);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(preferences),
    );
  }, [preferences]);

  const updatePreference = useCallback(
    (name, value) => {
      setPreferences(
        (current) => ({
          ...current,
          [name]: value,
        }),
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
      preferences,
      updatePreference,
    }),
    [preferences, updatePreference],
  );

  return (
    <PreferencesContext.Provider
      value={value}
    >
      {children}
    </PreferencesContext.Provider>
  );
}
