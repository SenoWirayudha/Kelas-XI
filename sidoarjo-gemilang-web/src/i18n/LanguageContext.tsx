import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { idTranslations, TranslationKeys as IDKeys } from './translations/id';
import { enTranslations, TranslationKeys as ENKeys } from './translations/en';

export type Language = 'id' | 'en';
export type TranslationKeys = IDKeys | ENKeys;

type Translations = typeof idTranslations | typeof enTranslations;

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKeys, params?: Record<string, string | number>) => string;
  translations: Translations;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translationsMap: Record<Language, Translations> = {
  id: idTranslations,
  en: enTranslations,
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get from localStorage or default to 'id'
    const saved = localStorage.getItem('preferred-language') as Language;
    return saved && (saved === 'id' || saved === 'en') ? saved : 'id';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferred-language', lang);
    document.documentElement.lang = lang;
  };

  const t = (key: TranslationKeys, params?: Record<string, string | number>): string => {
    const translations = translationsMap[language];
    let value = translations[key] || key;

    // Replace parameters like {{name}} with actual values
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(`{{${paramKey}}}`, String(paramValue));
      });
    }

    return value;
  };

  useEffect(() => {
    // Set initial language on mount
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations: translationsMap[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export default LanguageContext;
