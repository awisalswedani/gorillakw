import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';

const LanguageContext = createContext({
  language: 'ar',
  direction: 'rtl',
  setLanguage: (lang: string) => {},
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize language from localStorage or default to 'ar'
  const [language, setLang] = useState('ar');
  const [isMounted, setIsMounted] = useState(false);
  
  const direction = language === 'ar' ? 'rtl' : 'ltr';

  // Initialize language from localStorage only on client side
  useEffect(() => {
    setIsMounted(true);
    const savedLanguage = localStorage.getItem('language') || 'ar';
    setLang(savedLanguage);
  }, []);

  // Initialize document direction and i18n on first load
  useEffect(() => {
    if (isMounted && typeof document !== 'undefined') {
      document.documentElement.dir = direction;
      document.documentElement.lang = language;
      i18n.changeLanguage(language);
    }
  }, [language, direction, isMounted]);

  const setLanguage = (lang: string) => {
    setLang(lang);
    if (isMounted) {
      i18n.changeLanguage(lang);
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', lang);
      }
      if (typeof document !== 'undefined') {
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
      }
    }
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext); 