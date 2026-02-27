import React, { createContext, useContext, useState, useCallback } from 'react';
import translations from './translations';

const LanguageContext = createContext(null);

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('temadom_lang') || 'bg');

  const switchLang = useCallback((code) => {
    setLang(code);
    localStorage.setItem('temadom_lang', code);
  }, []);

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations['bg']?.[key] || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
