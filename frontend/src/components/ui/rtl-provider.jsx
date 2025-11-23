import React, { useEffect } from "react";
import "@/styles/rtl.css";

export default function RTLProvider({ language, children }) {
  useEffect(() => {
    // Set dir attribute on html element when language changes
    document.documentElement.dir = language === "he" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    
    // Apply language-specific styles
    if (language === "he") {
      document.body.classList.add("rtl-active");
    } else {
      document.body.classList.remove("rtl-active");
    }
    
    return () => {
      // Cleanup function in case component unmounts
      document.body.classList.remove("rtl-active");
    };
  }, [language]);

  return (
    <div dir={language === "he" ? "rtl" : "ltr"} className="h-full w-full">
      {children}
    </div>
  );
}
