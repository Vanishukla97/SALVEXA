'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { fetchApiJson } from '../../lib/api';
import { getAuthToken } from '../../lib/auth';
import {
  DEFAULT_USER_SETTINGS,
  normalizeUserSettings,
  type UserSettings,
} from '../../lib/userSettings';

const STORAGE_KEY = 'salvexa_user_settings';

type UserSettingsContextValue = {
  settings: UserSettings;
  setSettings: (settings: UserSettings) => void;
  refreshSettings: () => Promise<void>;
};

const UserSettingsContext = createContext<UserSettingsContextValue | undefined>(undefined);

function applySettingsToDocument(settings: UserSettings) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = settings.interfaceLanguage || 'en';
  document.documentElement.setAttribute('data-ui-locale', settings.interfaceLanguage || 'en-US');
  if (settings.animationsEnabled) {
    document.documentElement.classList.remove('reduce-motion');
  } else {
    document.documentElement.classList.add('reduce-motion');
  }
}

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<UserSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_USER_SETTINGS;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER_SETTINGS;
    try {
      return normalizeUserSettings(JSON.parse(raw));
    } catch {
      return DEFAULT_USER_SETTINGS;
    }
  });

  const setSettings = useCallback((next: UserSettings) => {
    const normalized = normalizeUserSettings(next);
    setSettingsState(normalized);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }
    applySettingsToDocument(normalized);
  }, []);

  const refreshSettings = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setSettings(DEFAULT_USER_SETTINGS);
      return;
    }
    try {
      const result = await fetchApiJson<{ success?: boolean; data?: unknown }>(
        '/settings',
        { token }
      );
      if (result.response.ok && result.payload?.success && result.payload.data) {
        setSettings(normalizeUserSettings(result.payload.data));
      }
    } catch {
      // Keep fallback settings if API unavailable.
    }
  }, [setSettings]);

  useEffect(() => {
    applySettingsToDocument(settings);
  }, [settings]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      void refreshSettings();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshSettings]);

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      refreshSettings,
    }),
    [settings, setSettings, refreshSettings]
  );

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error('useUserSettings must be used within UserSettingsProvider');
  }
  return context;
}
