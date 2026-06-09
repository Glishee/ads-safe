import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Translate from "@/components/translation/translate";
import { AlertCircle, Check, ChevronLeft, Mail, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { getTranslation } from "@/components/translation/translations";

export default function RegisterForm({ language }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    application_role: "advertiser",
    username: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value) => {
    setFormData((prev) => ({ ...prev, application_role: value }));
  };

  const validateEmail = () => {
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleContinue = async () => {
    setError("");

    if (step === 1 && !validateEmail()) return;
    if (step === 3 && !validatePassword()) return;

    if (step === 3) {
      setLoading(true);
      try {
        await User.register({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          application_role: formData.application_role,
        });

        setRegisteredEmail(formData.email);
        setRegistered(true);
      } catch (err) {
        const apiUrl = import.meta.env.VITE_API_URL || "localhost (NOT SET)";
        setError(`${err.message || "Request failed"} | API: ${apiUrl}`);
        console.error("Registration error:", err);
      } finally {
        setLoading(false);
      }
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError("");
    }
  };

  if (registered) {
    return (
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
            <Mail className="h-8 w-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold">{getTranslation(language, "checkYourEmail")}</h2>
          <p className="text-gray-500 text-sm">
            {getTranslation(language, "verificationEmailSent")}{" "}
            <strong className="text-gray-700">{registeredEmail}</strong>
          </p>
          <p className="text-gray-400 text-xs">{getTranslation(language, "verificationEmailInstructions")}</p>
        </div>
        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => navigate(createPageUrl("Login"))}>
          {getTranslation(language, "goToLogin")}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-4 sm:p-8 space-y-6 bg-white rounded-2xl shadow-xl">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          <Translate language={language} textKey="registerTitle" />
        </h1>
        <Progress value={(step / 3) * 100} className="h-1 mt-4" />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                <Translate language={language} textKey="email" />
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">
              <Translate language={language} textKey="chooseRole" />
            </h2>
            <RadioGroup 
              value={formData.application_role}
              onValueChange={handleRoleChange}
              className="space-y-4"
            >
              <div className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer ${language === "he" ? "flex-row-reverse" : ""} ${formData.application_role === 'advertiser' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} onClick={() => handleRoleChange("advertiser")}>
                <RadioGroupItem value="advertiser" id="advertiser" />
                <div className={`grid gap-1 flex-1 ${language === "he" ? "text-right" : ""}`}>
                  <Label htmlFor="advertiser" className="font-medium cursor-pointer">
                    <Translate language={language} textKey="advertiserRole" />
                  </Label>
                  <p className="text-sm text-gray-500">
                    <Translate language={language} textKey="advertiserDesc" />
                  </p>
                </div>
              </div>
              <div className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer ${language === "he" ? "flex-row-reverse" : ""} ${formData.application_role === 'channel_owner' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} onClick={() => handleRoleChange("channel_owner")}>
                <RadioGroupItem value="channel_owner" id="channel_owner" />
                <div className={`grid gap-1 flex-1 ${language === "he" ? "text-right" : ""}`}>
                  <Label htmlFor="channel_owner" className="font-medium cursor-pointer">
                    <Translate language={language} textKey="channelOwnerRole" />
                  </Label>
                  <p className="text-sm text-gray-500">
                    <Translate language={language} textKey="channelOwnerDesc" />
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                <Translate language={language} textKey="username" />
              </Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                <Translate language={language} textKey="password" />
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pr-10"
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                <Translate language={language} textKey="confirmPassword" />
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <Translate language={language} textKey="back" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(createPageUrl("Login"))}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <Translate language={language} textKey="login" />
            </Button>
          )}

          <Button
            type="button"
            onClick={handleContinue}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
          >
            {loading ? (
              <Translate language={language} textKey="loading" />
            ) : step === 3 ? (
              <>
                <Translate language={language} textKey="completeRegistration" />
                <Check className="h-4 w-4" />
              </>
            ) : (
              <Translate language={language} textKey="continue" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
