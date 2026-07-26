import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';

import PreferencesContext from './preferences-context';

const STORAGE_KEY = 'techsupply_preferences';
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)';
const VALID_THEMES = new Set(['system', 'light', 'dark']);

const DEFAULT_PREFERENCES = {
  theme: 'system',
  sidebarCollapsed: false,
  compactContent: false,
};

function readPreferences() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    const theme = VALID_THEMES.has(parsed?.theme)
      ? parsed.theme
      : DEFAULT_PREFERENCES.theme;

    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      theme,
      sidebarCollapsed: Boolean(parsed?.sidebarCollapsed),
      compactContent: Boolean(parsed?.compactContent),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function subscribeToSystemTheme(callback) {
  const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY);
  mediaQuery.addEventListener('change', callback);

  return () => mediaQuery.removeEventListener('change', callback);
}

function getSystemThemeSnapshot() {
  return window.matchMedia(SYSTEM_THEME_QUERY).matches;
}

function getServerThemeSnapshot() {
  return false;
}

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(readPreferences);

  const systemPrefersDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemThemeSnapshot,
    getServerThemeSnapshot,
  );

  const resolvedTheme = preferences.theme === 'system'
    ? systemPrefersDark
      ? 'dark'
      : 'light'
    : preferences.theme;

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(preferences),
    );
  }, [preferences]);

  useEffect(() => {
    const root = document.documentElement;

    root.dataset.theme = resolvedTheme;
    root.dataset.themePreference = preferences.theme;
    root.style.colorScheme = resolvedTheme;

    const themeColor = document.querySelector(
      'meta[name="theme-color"]',
    );

    themeColor?.setAttribute(
      'content',
      resolvedTheme === 'dark'
        ? '#09101d'
        : '#f4f7fb',
    );
  }, [preferences.theme, resolvedTheme]);

  const updatePreference = useCallback((name, value) => {
    setPreferences((current) => ({
      ...current,
      [name]: value,
    }));
  }, []);

  const setTheme = useCallback((theme) => {
    if (!VALID_THEMES.has(theme)) {
      return;
    }

    updatePreference('theme', theme);
  }, [updatePreference]);

  const value = useMemo(
    () => ({
      preferences,
      resolvedTheme,
      setTheme,
      updatePreference,
    }),
    [preferences, resolvedTheme, setTheme, updatePreference],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
