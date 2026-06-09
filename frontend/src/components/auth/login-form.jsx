
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Translate from "@/components/translation/translate";
import { AlertCircle, Mail, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getTranslation } from "@/components/translation/translations";

export default function LoginForm({ language }) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);

  // Resend flow
  const [resendEmail, setResendEmail]     = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showResendForm, setShowResendForm] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setEmailNotVerified(false);

    try {
      const user = await User.login({ identifier: identifier.trim(), password });
      if (user.role === "admin") {
        navigate(createPageUrl("AdminDashboard"));
      } else if (user.application_role === "channel_owner") {
        navigate(createPageUrl("ChannelOwnerDashboard"));
      } else {
        navigate(createPageUrl("AdvertiserDashboard"));
      }
    } catch (err) {
      let body = {};
      try { body = JSON.parse(err.message); } catch (_) {}
      if (body.email_not_verified) {
        setEmailNotVerified(true);
        setResendEmail(identifier.includes("@") ? identifier : "");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await User.resendVerification(resendEmail);
      setResendSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to resend.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-4 sm:p-8 space-y-6 bg-white rounded-2xl shadow-xl">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          <Translate language={language} textKey="login" />
        </h1>
        <p className="text-sm text-gray-500">
          <Translate language={language} textKey="welcome" />
        </p>
      </div>

      {/* Email not verified warning */}
      {emailNotVerified && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 space-y-3">
          <div className="flex items-start gap-2 text-yellow-800">
            <Mail className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{getTranslation(language, "emailNotVerified")}</p>
          </div>

          {resendSuccess ? (
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              {getTranslation(language, "emailResent")}
            </div>
          ) : showResendForm ? (
            <form onSubmit={handleResend} className="flex gap-2">
              <Input
                type="email"
                value={resendEmail}
                onChange={e => setResendEmail(e.target.value)}
                className="flex-1 h-8 text-sm"
                required
              />
              <Button type="submit" size="sm" disabled={resendLoading} className="shrink-0">
                {resendLoading ? "..." : getTranslation(language, "send")}
              </Button>
            </form>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border-yellow-300 text-yellow-800 hover:bg-yellow-100 w-full"
              onClick={() => setShowResendForm(true)}
            >
              {getTranslation(language, "resendVerificationEmail")}
            </Button>
          )}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="identifier">
            {getTranslation(language, "emailOrUsername")}
          </Label>
          <Input
            id="identifier"
            type="text"
            placeholder="you@example.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="w-full"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">
            <Translate language={language} textKey="password" />
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pr-10"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 transition-transform active:scale-95"
          disabled={isLoading}
        >
          {isLoading ? (
            <Translate language={language} textKey="loading" />
          ) : (
            <Translate language={language} textKey="login" />
          )}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm">
        <span className="text-gray-500">
          <Translate language={language} textKey="noAccount" />
        </span>{" "}
        <Button
          variant="link"
          className="p-0"
          onClick={() => navigate(createPageUrl("Register"))}
        >
          <Translate language={language} textKey="register" />
        </Button>
      </div>
    </div>
  );
}
