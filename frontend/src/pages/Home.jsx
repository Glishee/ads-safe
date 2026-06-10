import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { User, TelegramChannel } from "@/api/entities";
import { getTranslation } from "@/components/translation/translations";
import { useLanguage } from "@/components/contexts/LanguageContext";
import {
  MessageSquare,
  Users,
  ArrowRight,
  ArrowLeft,
  BarChart3,
  ShieldCheck,
  Sparkles,
  BadgeCheck,
  Wallet,
  Globe,
  CheckCircle2,
  Megaphone,
  Send,
} from "lucide-react";

function formatCount(n) {
  if (!n) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, "")}M+`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
  return `${n}`;
}

export default function Home() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === "he";
  const t = (key) => getTranslation(language, key);
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const [user, setUser] = React.useState(null);
  const [stats, setStats] = React.useState(null);

  React.useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (error) {
        // User is not logged in - no action needed
      }
    };
    checkUser();
  }, []);

  React.useEffect(() => {
    const loadStats = async () => {
      try {
        const channels = await TelegramChannel.filter({ is_approved: true });
        if (!Array.isArray(channels) || channels.length === 0) return;
        const reach = channels.reduce((sum, ch) => sum + (ch.subscribers_count || 0), 0);
        const categories = new Set(channels.map(ch => ch.category).filter(Boolean)).size;
        setStats({ channels: channels.length, reach, categories });
      } catch (error) {
        // Stats are decorative — hide the strip if the API is unreachable
      }
    };
    loadStats();
  }, []);

  const goToDashboard = () => {
    if (!user) {
      navigate(createPageUrl("Register"));
      return;
    }
    if (user.role === "admin") {
      navigate(createPageUrl("AdminDashboard"));
    } else if (user.application_role === "channel_owner") {
      navigate(createPageUrl("ChannelOwnerDashboard"));
    } else {
      navigate(createPageUrl("AdvertiserDashboard"));
    }
  };

  const steps = [
    { icon: MessageSquare, title: "step1Title", desc: "step1Desc" },
    { icon: Send,          title: "step2Title", desc: "step2Desc" },
    { icon: BadgeCheck,    title: "step3Title", desc: "step3Desc" },
  ];

  const features = [
    { icon: BadgeCheck,  color: "text-blue-600 bg-blue-50",     title: "featVerifiedTitle",   desc: "featVerifiedDesc" },
    { icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50", title: "featModerationTitle", desc: "featModerationDesc" },
    { icon: Users,       color: "text-purple-600 bg-purple-50", title: "featDualTitle",       desc: "featDualDesc" },
    { icon: Wallet,      color: "text-amber-600 bg-amber-50",   title: "featPricingTitle",    desc: "featPricingDesc" },
    { icon: BarChart3,   color: "text-sky-600 bg-sky-50",       title: "featAnalyticsTitle",  desc: "featAnalyticsDesc" },
    { icon: Globe,       color: "text-rose-600 bg-rose-50",     title: "featBilingualTitle",  desc: "featBilingualDesc" },
  ];

  const advBullets = ["advBullet1", "advBullet2", "advBullet3", "advBullet4"];
  const ownerBullets = ["ownerBullet1", "ownerBullet2", "ownerBullet3", "ownerBullet4"];

  return (
    <div className="min-h-screen bg-white" dir={isRTL ? "rtl" : "ltr"}>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        {/* Glow accents */}
        <div className="pointer-events-none absolute -top-44 -left-44 h-[480px] w-[480px] rounded-full bg-blue-600/30 blur-3xl" />
        <div className="pointer-events-none absolute top-10 -right-32 h-[400px] w-[400px] rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-[420px] w-[420px] rounded-full bg-purple-600/20 blur-3xl" />

        <div className="container relative mx-auto px-4 pt-16 pb-24 md:pt-28 md:pb-36 text-center">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-blue-200 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {t("homeBadge")}
          </div>

          <h1 className="animate-in fade-in slide-in-from-bottom-4 duration-700 mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            {t("homeHeroTitle1")}{" "}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              {t("homeHeroTitle2")}
            </span>
          </h1>

          <p className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg md:text-xl">
            {t("homeHeroSubtitle")}
          </p>

          <div className="animate-in fade-in duration-700 delay-300 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              onClick={goToDashboard}
              className="h-12 w-full px-8 text-base font-semibold bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/25 transition-transform hover:scale-[1.03] active:scale-95 sm:w-auto"
            >
              {user ? t("homeGoToDashboard") : t("getStarted")}
              <Arrow className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl(user ? "AddChannel" : "Register"))}
              className="h-12 w-full px-8 text-base font-semibold border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white backdrop-blur sm:w-auto"
            >
              <Megaphone className="h-5 w-5" />
              {t("monetizeMyChannel")}
            </Button>
          </div>

          <p className="animate-in fade-in duration-700 delay-500 mt-8 text-sm text-slate-400">
            {t("homeTrustLine")}
          </p>
        </div>
      </section>

      {/* ===== Stats strip (overlapping hero) ===== */}
      {stats && (
        <section className="container relative z-10 mx-auto -mt-12 px-4 md:-mt-16">
          <div className="grid grid-cols-3 divide-x divide-gray-100 rounded-2xl border border-gray-100 bg-white py-6 shadow-xl shadow-slate-900/5 rtl:divide-x-reverse">
            {[
              { value: formatCount(stats.channels), label: t("statsChannels") },
              { value: formatCount(stats.reach),    label: t("statsReach") },
              { value: stats.categories,            label: t("statsCategories") },
            ].map((item, i) => (
              <div key={i} className="px-2 text-center">
                <div className="text-2xl font-bold text-slate-900 md:text-4xl">{item.value}</div>
                <div className="mt-1 text-xs text-gray-500 md:text-sm">{item.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== How it works ===== */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {t("howItWorks")}
            </h2>
            <p className="mt-4 text-gray-600">
              {t("howItWorksSubtitle")}
            </p>
          </div>

          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connector line (desktop) */}
            <div className="pointer-events-none absolute top-10 left-[16%] right-[16%] hidden border-t-2 border-dashed border-blue-200 md:block" />

            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative text-center">
                  <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25">
                    <Icon className="h-9 w-9" />
                    <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-600 shadow ring-1 ring-gray-100">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-slate-900">{t(step.title)}</h3>
                  <p className="mx-auto max-w-xs text-sm leading-relaxed text-gray-600">{t(step.desc)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Why AdMarket ===== */}
      <section className="bg-slate-50 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {t("whyAdMarket")}
            </h2>
            <p className="mt-4 text-gray-600">
              {t("whyAdMarketSubtitle")}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg hover:shadow-slate-900/5"
                >
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 font-semibold text-slate-900">{t(feature.title)}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{t(feature.desc)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== For advertisers / channel owners ===== */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Advertisers */}
            <div className="flex flex-col rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white md:p-10">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <Megaphone className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold md:text-3xl">{t("forAdvertisers")}</h2>
              <p className="mt-3 text-blue-100">{t("homeAdvDesc")}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {advBullets.map(key => (
                  <li key={key} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
                    <span className="text-sm text-blue-50">{t(key)}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => navigate(createPageUrl(user ? "ChannelsList" : "Register"))}
                className="mt-8 h-11 w-full bg-white font-semibold text-blue-700 hover:bg-blue-50 sm:w-auto sm:self-start"
              >
                {t("startAdvertising")}
                <Arrow className="h-4 w-4" />
              </Button>
            </div>

            {/* Channel owners */}
            <div className="flex flex-col rounded-3xl bg-gradient-to-br from-purple-600 to-fuchsia-700 p-8 text-white md:p-10">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold md:text-3xl">{t("forChannelOwners")}</h2>
              <p className="mt-3 text-purple-100">{t("homeOwnerDesc")}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {ownerBullets.map(key => (
                  <li key={key} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-fuchsia-200" />
                    <span className="text-sm text-purple-50">{t(key)}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => navigate(createPageUrl(user ? "AddChannel" : "Register"))}
                className="mt-8 h-11 w-full bg-white font-semibold text-purple-700 hover:bg-purple-50 sm:w-auto sm:self-start"
              >
                {t("becomePartner")}
                <Arrow className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="container mx-auto px-4 pb-20 md:pb-28">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-16 text-center text-white md:py-20">
          <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
              {t("readyToStart")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-300">
              {t("joinCommunity")}
            </p>
            <Button
              onClick={goToDashboard}
              className="mt-8 h-12 px-8 text-base font-semibold bg-blue-500 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/25 transition-transform hover:scale-[1.03] active:scale-95"
            >
              {user ? t("homeGoToDashboard") : t("createAccount")}
              <Arrow className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-slate-800 bg-slate-950 py-14 text-slate-400">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <h3 className="text-xl font-bold text-white">AdMarket</h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed">{t("footerTagline")}</p>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
                {t("footerProduct")}
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button onClick={() => navigate(createPageUrl("ChannelsList"))} className="transition-colors hover:text-white">
                    {t("footerForAdvertisers")}
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate(createPageUrl(user ? "AddChannel" : "Register"))} className="transition-colors hover:text-white">
                    {t("footerForOwners")}
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate(createPageUrl("Register"))} className="transition-colors hover:text-white">
                    {t("register")}
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
                {t("footerLegal")}
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => navigate(createPageUrl("TermsOfService"))} className="transition-colors hover:text-white">{t("termsOfService")}</button></li>
                <li><button onClick={() => navigate(createPageUrl("PrivacyPolicy"))} className="transition-colors hover:text-white">{t("privacyPolicy")}</button></li>
                <li><button onClick={() => navigate(createPageUrl("ContactUs"))} className="transition-colors hover:text-white">{t("contact")}</button></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} AdMarket. {t("allRightsReserved")}
          </div>
        </div>
      </footer>
    </div>
  );
}
