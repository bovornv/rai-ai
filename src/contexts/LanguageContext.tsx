import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, detectLanguage, t, I18nKey } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: I18nKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Try to get from localStorage first, then detect system language
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rai-ai-language') as Language;
      if (saved && (saved === 'th' || saved === 'en')) {
        return saved;
      }
    }
    return detectLanguage();
  });

  // Save language preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rai-ai-language', language);
    }
  }, [language]);

  const translate = (key: I18nKey): string => {
    return t(key, language);
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translate,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
