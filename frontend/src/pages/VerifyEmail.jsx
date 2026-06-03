import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { getTranslation } from "@/components/translation/translations";
import { useLanguage } from "@/components/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      return;
    }
    User.verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
            <p className="text-gray-600">{getTranslation(language, "verifyingEmail")}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">{getTranslation(language, "emailVerified")}</h2>
            <p className="text-gray-500 text-sm">{getTranslation(language, "emailVerifiedMsg")}</p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => navigate(createPageUrl("Login"))}>
              {getTranslation(language, "goToLogin")}
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-14 w-14 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold">{getTranslation(language, "emailVerificationFailed")}</h2>
            <p className="text-gray-500 text-sm">{getTranslation(language, "invalidOrExpiredToken")}</p>
            <Button variant="outline" className="w-full" onClick={() => navigate(createPageUrl("Login"))}>
              {getTranslation(language, "goToLogin")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
