import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

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

const PreferencesContext =
  createContext(null);

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

  const updatePreference = (
    name,
    value,
  ) => {
    setPreferences(
      (current) => ({
        ...current,
        [name]: value,
      }),
    );
  };

  const value = useMemo(
    () => ({
      preferences,
      updatePreference,
    }),
    [preferences],
  );

  return (
    <PreferencesContext.Provider
      value={value}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(
    PreferencesContext,
  );

  if (!context) {
    throw new Error(
      'usePreferences debe utilizarse dentro de PreferencesProvider',
    );
  }

  return context;
}
