import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale } from '../types/schema';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (idText?: string | null, enText?: string | null) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('museum_lang');
    return saved === 'en' ? 'en' : 'id';
  });

  useEffect(() => {
    localStorage.setItem('museum_lang', locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  const toggleLocale = () => {
    setLocaleState((prev) => (prev === 'id' ? 'en' : 'id'));
  };

  // Helper to safely select translated string with fallback
  const t = (idText?: string | null, enText?: string | null): string => {
    if (locale === 'en') {
      return enText || idText || '';
    }
    return idText || enText || '';
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
