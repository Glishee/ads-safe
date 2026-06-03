import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { getTranslation } from "@/components/translation/translations";
import { useLanguage } from "@/components/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserCircle, Lock, CheckCircle2, AlertCircle } from "lucide-react";

export default function AccountSettings() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);

  // Profile form
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [profileMsg, setProfileMsg] = useState(null); // { type: "success"|"error", text }
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [pwMsg, setPwMsg]           = useState(null);
  const [savingPw, setSavingPw]     = useState(false);

  useEffect(() => {
    User.me().then(u => {
      setUser(u);
      setUsername(u.username || "");
      setEmail(u.email || "");
      setLoading(false);
    }).catch(() => navigate("/Login"));
  }, [navigate]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    if (username === user.username && email === user.email) {
      setProfileMsg({ type: "error", text: getTranslation(language, "nothingToUpdate") });
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await User.updateProfile({ username, email });
      setUser(updated);
      setProfileMsg({ type: "success", text: getTranslation(language, "profileUpdated") });
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("taken"))         setProfileMsg({ type: "error", text: getTranslation(language, "usernameAlreadyTaken") });
      else if (msg.includes("in use"))   setProfileMsg({ type: "error", text: getTranslation(language, "emailAlreadyInUse") });
      else                               setProfileMsg({ type: "error", text: msg || getTranslation(language, "error") });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ type: "error", text: getTranslation(language, "passwordMismatch") });
      return;
    }
    if (newPw.length < 6) {
      setPwMsg({ type: "error", text: getTranslation(language, "passwordTooShort") });
      return;
    }
    setSavingPw(true);
    try {
      await User.updateProfile({ current_password: currentPw, new_password: newPw });
      setPwMsg({ type: "success", text: getTranslation(language, "passwordChanged") });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("incorrect"))    setPwMsg({ type: "error", text: getTranslation(language, "currentPasswordIncorrect") });
      else if (msg.includes("required")) setPwMsg({ type: "error", text: getTranslation(language, "currentPasswordRequired") });
      else                               setPwMsg({ type: "error", text: msg || getTranslation(language, "error") });
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold">
        {getTranslation(language, "accountSettings")}
      </h1>

      {/* Profile card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-blue-500" />
            {getTranslation(language, "profileSettings")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">{getTranslation(language, "username")}</Label>
              <Input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">{getTranslation(language, "email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {profileMsg && (
              <Alert className={profileMsg.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"}>
                {profileMsg.type === "success"
                  ? <CheckCircle2 className="h-4 w-4" />
                  : <AlertCircle className="h-4 w-4" />}
                <AlertDescription>{profileMsg.text}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={savingProfile}>
              {savingProfile
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : null}
              {getTranslation(language, "saveProfile")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-500" />
            {getTranslation(language, "changePassword")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPw">{getTranslation(language, "currentPassword")}</Label>
              <Input
                id="currentPw"
                type="password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPw">{getTranslation(language, "newPassword")}</Label>
              <Input
                id="newPw"
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPw">{getTranslation(language, "confirmNewPassword")}</Label>
              <Input
                id="confirmPw"
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {pwMsg && (
              <Alert className={pwMsg.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"}>
                {pwMsg.type === "success"
                  ? <CheckCircle2 className="h-4 w-4" />
                  : <AlertCircle className="h-4 w-4" />}
                <AlertDescription>{pwMsg.text}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={savingPw}>
              {savingPw
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : null}
              {getTranslation(language, "changePassword")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
