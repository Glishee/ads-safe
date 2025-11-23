
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from "@/api/entities";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const initLanguage = async () => {
      try {
        // Try to get user's preference first
        const userData = await User.me();
        if (userData?.language_preference) {
          setLanguage(userData.language_preference);
          return;
        }
      } catch (error) {
        // User not logged in, try localStorage
        const savedLanguage = localStorage.getItem("preferredLanguage");
        if (savedLanguage === "en" || savedLanguage === "he") {
          setLanguage(savedLanguage);
        } else {
          localStorage.setItem("preferredLanguage", "en");
          setLanguage("en");
        }
      }
    };

    initLanguage();
  }, []);

  const toggleLanguage = async () => {
    const newLanguage = language === "en" ? "he" : "en";
    
    // Save to localStorage
    localStorage.setItem("preferredLanguage", newLanguage);
    
    // Update user preference if logged in
    try {
      const user = await User.me();
      if (user) {
        await User.updateMyUserData({ language_preference: newLanguage });
      }
    } catch (error) {
      // User not logged in, that's fine
      console.log("User not logged in, language saved to localStorage only");
    }
    
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
