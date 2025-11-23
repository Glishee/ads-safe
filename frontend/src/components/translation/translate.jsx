import React from "react";
import { getTranslation } from "./translations";

export default function Translate({ language, textKey, children }) {
  const translatedText = getTranslation(language, textKey);
  
  // If children is a function, call it with the translated text
  if (typeof children === "function") {
    return children(translatedText);
  }
  
  // Otherwise, just return the translated text
  return translatedText;
}