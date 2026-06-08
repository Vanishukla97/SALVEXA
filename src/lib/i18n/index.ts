'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { TranslationKey, Translations } from './types';
import { en } from './en';
import { hi } from './hi';

const translationMap: Record<string, Translations> = {
  en,
  hi,
};

type I18nContextValue = {
  locale: string;
  setLocale: (code: string) => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children, initialLocale = 'en' }: { children: React.ReactNode; initialLocale?: string }) {
  const [locale, setLocaleState] = useState(initialLocale);

  const setLocale = useCallback((code: string) => {
    setLocaleState(code);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = code;
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const translations = translationMap[locale] || translationMap['en'];
      return translations[key] || key;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

export type { TranslationKey, Translations };
