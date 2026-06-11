import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, SystemSettings } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings, DollarSign, Users, Shield, Wrench, Save } from "lucide-react";
import { getTranslation } from "@/components/translation/translations";
import { useLanguage } from "@/components/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardHeader from "@/components/dashboard/dashboard-header";

const TABS = [
  { key: "general",      labelKey: "generalSettings",      icon: Settings },
  { key: "pricing",      labelKey: "pricingSettings",      icon: DollarSign },
  { key: "registration", labelKey: "registrationSettings", icon: Users },
  { key: "moderation",   labelKey: "moderationSettings",   icon: Shield },
  { key: "maintenance",  labelKey: "maintenanceSettings",  icon: Wrench },
];

function ToggleRow({ labelKey, helpKey, checked, onChange, danger = false, language }) {
  return (
    <div className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${danger ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
      <div className="min-w-0 flex-1">
        <p className={`font-medium text-sm ${danger ? "text-red-700" : "text-slate-800"}`}>
          {getTranslation(language, labelKey)}
        </p>
        <p className={`text-xs mt-0.5 ${danger ? "text-red-500" : "text-gray-500"}`}>
          {getTranslation(language, helpKey)}
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}

export default function AdminSettings() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [settings, setSettings] = useState({
    support_email: "",
    support_telegram: "",
    commission_rate: 10,
    min_post_price: 50,
    max_post_price: 10000,
    allow_registration: true,
    require_email_verification: false,
    auto_approve_channels: false,
    auto_approve_ad_requests: false,
    maintenance_mode: false,
    maintenance_message: "We're currently undergoing maintenance. Please check back soon.",
  });

  useEffect(() => {
    const init = async () => {
      try {
        const user = await User.me();
        if (user.role !== "admin") {
          navigate(createPageUrl("AdminDashboard"));
          return;
        }
        const data = await SystemSettings.get();
        setSettings(prev => ({ ...prev, ...data }));
      } catch (e) {
        if (e.message?.includes("401") || e.message?.includes("Not logged in")) {
          navigate(createPageUrl("Login"));
        } else {
          setError(getTranslation(language, "error"));
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const set = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await SystemSettings.update(settings);
      setSettings(prev => ({ ...prev, ...updated }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(getTranslation(language, "error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-28 w-full rounded-3xl" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <DashboardHeader accent="slate" title={getTranslation(language, "systemSettings")}>
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("AdminDashboard"))}
          className="text-white hover:text-white hover:bg-white/10 flex items-center gap-2"
          size="sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {getTranslation(language, "backToDashboard")}
        </Button>
      </DashboardHeader>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto bg-gray-100 p-1 rounded-xl">
        {TABS.map(({ key, labelKey, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${activeTab === key ? "bg-white shadow-sm text-slate-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {getTranslation(language, labelKey)}
          </button>
        ))}
      </div>

      {/* Content card */}
      <Card className="rounded-2xl border-gray-200 shadow-md bg-white">
        <CardHeader>
          <CardTitle className="text-base">
            {getTranslation(language, TABS.find(t => t.key === activeTab)?.labelKey)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* ── General ── */}
          {activeTab === "general" && (
            <>
              <div className="space-y-2">
                <Label>{getTranslation(language, "supportEmail")}</Label>
                <Input
                  type="email"
                  value={settings.support_email}
                  onChange={e => set("support_email", e.target.value)}
                  placeholder="support@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>{getTranslation(language, "supportTelegram")}</Label>
                <Input
                  value={settings.support_telegram}
                  onChange={e => set("support_telegram", e.target.value)}
                  placeholder="https://t.me/support"
                />
              </div>
            </>
          )}

          {/* ── Pricing ── */}
          {activeTab === "pricing" && (
            <>
              <div className="space-y-2">
                <Label>{getTranslation(language, "commissionRate")}</Label>
                <p className="text-xs text-gray-500">{getTranslation(language, "commissionRateHelp")}</p>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.commission_rate}
                  onChange={e => set("commission_rate", Number(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{getTranslation(language, "minPostPrice")}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={settings.min_post_price}
                    onChange={e => set("min_post_price", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{getTranslation(language, "maxPostPrice")}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={settings.max_post_price}
                    onChange={e => set("max_post_price", Number(e.target.value))}
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Registration ── */}
          {activeTab === "registration" && (
            <div className="space-y-3">
              <ToggleRow
                language={language}
                labelKey="allowRegistration"
                helpKey="allowRegistrationHelp"
                checked={settings.allow_registration}
                onChange={v => set("allow_registration", v)}
              />
              <ToggleRow
                language={language}
                labelKey="requireEmailVerification"
                helpKey="requireEmailVerificationHelp"
                checked={settings.require_email_verification}
                onChange={v => set("require_email_verification", v)}
              />
            </div>
          )}

          {/* ── Moderation ── */}
          {activeTab === "moderation" && (
            <div className="space-y-3">
              <ToggleRow
                language={language}
                labelKey="autoApproveChannels"
                helpKey="autoApproveChannelsHelp"
                checked={settings.auto_approve_channels}
                onChange={v => set("auto_approve_channels", v)}
              />
              <ToggleRow
                language={language}
                labelKey="autoApproveAdRequests"
                helpKey="autoApproveAdRequestsHelp"
                checked={settings.auto_approve_ad_requests}
                onChange={v => set("auto_approve_ad_requests", v)}
              />
            </div>
          )}

          {/* ── Maintenance ── */}
          {activeTab === "maintenance" && (
            <div className="space-y-4">
              <ToggleRow
                language={language}
                labelKey="maintenanceMode"
                helpKey="maintenanceModeHelp"
                checked={settings.maintenance_mode}
                onChange={v => set("maintenance_mode", v)}
                danger
              />
              <div className="space-y-2">
                <Label>{getTranslation(language, "maintenanceMessage")}</Label>
                <Textarea
                  rows={3}
                  value={settings.maintenance_message}
                  onChange={e => set("maintenance_message", e.target.value)}
                  placeholder={getTranslation(language, "maintenanceMessagePlaceholder")}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save bar */}
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      {saved && <p className="text-sm text-green-600 text-center">{getTranslation(language, "settingsSaved")}</p>}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
          <Save className="h-4 w-4" />
          {saving ? getTranslation(language, "saving") : getTranslation(language, "saveSettings")}
        </Button>
      </div>
    </div>
  );
}
