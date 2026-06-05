
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Translate from "@/components/translation/translate";
import { AlertCircle, Mail, CheckCircle2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getTranslation } from "@/components/translation/translations";

export default function LoginForm({ language }) {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [slowLoad, setSlowLoad] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const slowLoadTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const emailRef = useRef(email);
  const passwordRef = useRef(password);

  useEffect(() => { emailRef.current = email; }, [email]);
  useEffect(() => { passwordRef.current = password; }, [password]);

  // Resend flow
  const [resendEmail, setResendEmail]   = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showResendForm, setShowResendForm] = useState(false);

  const isNetworkError = (msg) =>
    !msg || msg === "Load failed" || msg === "Failed to fetch" || msg.includes("NetworkError") || msg.includes("network");

  const doLogin = async (emailVal, passwordVal) => {
    setIsLoading(true);
    setError("");
    setSlowLoad(false);
    setRetryCountdown(0);
    clearInterval(countdownRef.current);
    slowLoadTimerRef.current = setTimeout(() => setSlowLoad(true), 5000);

    try {
      const user = await User.login({ email: emailVal, password: passwordVal });
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
        setResendEmail(emailVal);
      } else if (isNetworkError(err.message)) {
        // Auto-retry countdown
        let secs = 10;
        setRetryCountdown(secs);
        countdownRef.current = setInterval(() => {
          secs -= 1;
          if (secs <= 0) {
            clearInterval(countdownRef.current);
            setRetryCountdown(0);
            doLogin(emailRef.current, passwordRef.current);
          } else {
            setRetryCountdown(secs);
          }
        }, 1000);
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      clearTimeout(slowLoadTimerRef.current);
      setIsLoading(false);
      setSlowLoad(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    clearInterval(countdownRef.current);
    setRetryCountdown(0);
    setEmailNotVerified(false);
    doLogin(email, password);
  };

  // Clean up on unmount
  useEffect(() => () => {
    clearTimeout(slowLoadTimerRef.current);
    clearInterval(countdownRef.current);
  }, []);

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

      {retryCountdown > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-800 text-sm">
            <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
            <span>
              {getTranslation(language, "serverWarmingUp") || "Server is starting up…"}
              {" "}<span className="font-semibold">{retryCountdown}s</span>
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100 h-7 text-xs"
            onClick={() => doLogin(email, password)}
          >
            {getTranslation(language, "retry") || "Retry now"}
          </Button>
        </div>
      )}

      {error && !retryCountdown && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">
            <Translate language={language} textKey="email" />
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">
            <Translate language={language} textKey="password" />
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full"
          />
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
        {slowLoad && (
          <p className="text-xs text-amber-600 text-center mt-1">
            {getTranslation(language, "serverWarmingUp") || "Server is starting up, please wait…"}
          </p>
        )}
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
