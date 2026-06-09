import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, SystemSettings } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/contexts/LanguageContext";
import { getTranslation } from "@/components/translation/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  DollarSign,
  Users,
  Shield,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from "lucide-react";

const SECTIONS = [
  { id: "general",      icon: Settings,    labelKey: "generalSettings" },
  { id: "pricing",      icon: DollarSign,  labelKey: "pricingSettings" },
  { id: "registration", icon: Users,       labelKey: "registrationSettings" },
  { id: "moderation",   icon: Shield,      labelKey: "moderationSettings" },
  { id: "maintenance",  icon: Wrench,      labelKey: "maintenanceSettings" },
];

export default function AdminSettings() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeSection, setActiveSection] = useState("general");
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await User.me();
        if (user.role !== "admin") {
          navigate(createPageUrl("Home"));
          return;
        }
        const data = await SystemSettings.get();
        setSettings(data);
      } catch (err) {
        if (err.status === 401) navigate(createPageUrl("Login"));
        else setError(err.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSuccess("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await SystemSettings.update(settings);
      setSettings(updated);
      setSuccess(getTranslation(language, "settingsSaved"));
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  const t = (key) => getTranslation(language, key);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl("AdminDashboard"))}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("backToDashboard")}
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          {t("systemSettings")}
        </h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar nav */}
        <nav className="md:w-52 shrink-0">
          <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {SECTIONS.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                    ${activeSection === section.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(section.labelKey)}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Settings panel */}
        <div className="flex-1 min-w-0">
          {activeSection === "general" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {t("generalSettings")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="platform_name">{t("platformName")}</Label>
                  <Input
                    id="platform_name"
                    value={settings.platform_name || ""}
                    onChange={e => handleChange("platform_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_email">{t("supportEmail")}</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={settings.support_email || ""}
                    onChange={e => handleChange("support_email", e.target.value)}
                    placeholder="support@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_telegram">{t("supportTelegram")}</Label>
                  <Input
                    id="support_telegram"
                    value={settings.support_telegram || ""}
                    onChange={e => handleChange("support_telegram", e.target.value)}
                    placeholder="https://t.me/support"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "pricing" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {t("pricingSettings")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="commission_rate">{t("commissionRate")}</Label>
                  <p className="text-xs text-gray-500">{t("commissionRateHelp")}</p>
                  <div className="relative w-40">
                    <Input
                      id="commission_rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={settings.commission_rate ?? 10}
                      onChange={e => handleChange("commission_rate", Number(e.target.value))}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-400 text-sm">%</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_post_price">{t("minPostPrice")}</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 text-sm">₪</span>
                      <Input
                        id="min_post_price"
                        type="number"
                        min="0"
                        step="1"
                        value={settings.min_post_price ?? 50}
                        onChange={e => handleChange("min_post_price", Number(e.target.value))}
                        className="pl-7"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_post_price">{t("maxPostPrice")}</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 text-sm">₪</span>
                      <Input
                        id="max_post_price"
                        type="number"
                        min="0"
                        step="1"
                        value={settings.max_post_price ?? 10000}
                        onChange={e => handleChange("max_post_price", Number(e.target.value))}
                        className="pl-7"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "registration" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t("registrationSettings")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <ToggleRow
                  id="allow_registration"
                  label={t("allowRegistration")}
                  description={t("allowRegistrationHelp")}
                  checked={settings.allow_registration ?? true}
                  onChange={v => handleChange("allow_registration", v)}
                />
                <ToggleRow
                  id="require_email_verification"
                  label={t("requireEmailVerification")}
                  description={t("requireEmailVerificationHelp")}
                  checked={settings.require_email_verification ?? true}
                  onChange={v => handleChange("require_email_verification", v)}
                />
              </CardContent>
            </Card>
          )}

          {activeSection === "moderation" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t("moderationSettings")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <ToggleRow
                  id="auto_approve_channels"
                  label={t("autoApproveChannels")}
                  description={t("autoApproveChannelsHelp")}
                  checked={settings.auto_approve_channels ?? false}
                  onChange={v => handleChange("auto_approve_channels", v)}
                />
                <ToggleRow
                  id="auto_approve_ad_requests"
                  label={t("autoApproveAdRequests")}
                  description={t("autoApproveAdRequestsHelp")}
                  checked={settings.auto_approve_ad_requests ?? false}
                  onChange={v => handleChange("auto_approve_ad_requests", v)}
                />
              </CardContent>
            </Card>
          )}

          {activeSection === "maintenance" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  {t("maintenanceSettings")}
                </CardTitle>
                <CardDescription>
                  {t("maintenanceModeHelp")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ToggleRow
                  id="maintenance_mode"
                  label={t("maintenanceMode")}
                  description={t("maintenanceModeHelp")}
                  checked={settings.maintenance_mode ?? false}
                  onChange={v => handleChange("maintenance_mode", v)}
                  danger
                />
                <div className="space-y-2">
                  <Label htmlFor="maintenance_message">{t("maintenanceMessage")}</Label>
                  <Textarea
                    id="maintenance_message"
                    rows={3}
                    value={settings.maintenance_message || ""}
                    onChange={e => handleChange("maintenance_message", e.target.value)}
                    placeholder={t("maintenanceMessagePlaceholder")}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end mt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
            >
              {saving
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("saving")}</>
                : t("saveSettings")
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ id, label, description, checked, onChange, danger = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="flex-1">
        <label
          htmlFor={id}
          className={`text-sm font-medium cursor-pointer ${danger && checked ? "text-red-600" : ""}`}
        >
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className={danger && checked ? "data-[state=checked]:bg-red-500" : ""}
      />
    </div>
  );
}
