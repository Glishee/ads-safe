
import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const saved = localStorage.getItem("preferredLanguage");
  const [language, setLanguage] = useState(saved === "he" ? "he" : "en");

  const toggleLanguage = () => {
    const newLanguage = language === "en" ? "he" : "en";
    localStorage.setItem("preferredLanguage", newLanguage);
    setLanguage(newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
