import React from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export default function LanguageSwitcher({ currentLanguage, onToggle }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 shadow-sm rounded-lg transition-all duration-200"
    >
      <Globe className="h-4 w-4" />
      <span className="font-medium">{currentLanguage === "en" ? "עברית" : "English"}</span>
    </Button>
  );
}