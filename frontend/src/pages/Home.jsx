import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { User, TelegramChannel } from "@/api/entities";
import { getTranslation } from "@/components/translation/translations";
import { useLanguage } from "@/components/contexts/LanguageContext";
import {
  MessageSquare, Users, ArrowRight, ArrowLeft, BarChart3,
  ShieldCheck, Sparkles, BadgeCheck, Wallet, Globe,
  CheckCircle2, Megaphone, Send,
} from "lucide-react";

/* ── helpers ── */

function formatCount(n) {
  if (!n) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, "")}M+`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
  return `${n}`;
}

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useCountUp(target, duration = 1400, active = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active || !target) return;
    const numeric = parseInt(String(target).replace(/\D/g, ""), 10);
    if (!numeric) { setValue(target); return; }
    const suffix = String(target).replace(/[\d.]/g, "");
    const start = performance.now();
    const raf = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const cur = Math.round(ease * numeric);
      setValue(cur >= 1000 ? `${(cur / 1000).toFixed(1).replace(/\.0$/, "")}K${suffix}` : `${cur}${suffix}`);
      if (t < 1) requestAnimationFrame(raf);
      else setValue(target);
    };
    requestAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

function StatItem({ value, label, active }) {
  const display = useCountUp(value, 1200, active);
  return (
    <div className="px-2 text-center">
      <div className="text-2xl font-bold text-slate-900 md:text-4xl tabular-nums">{display || value}</div>
      <div className="mt-1 text-xs text-gray-500 md:text-sm">{label}</div>
    </div>
  );
}

/* ── main component ── */

export default function Home() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === "he";
  const t = (key) => getTranslation(language, key);
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    User.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    document.title = language === "he"
      ? "AdMarket — פלטפורמת פרסום בערוצי טלגרם"
      : "AdMarket — Telegram Advertising Marketplace";
  }, [language]);

  useEffect(() => {
    TelegramChannel.filter({ is_approved: true }).then(channels => {
      if (!Array.isArray(channels) || !channels.length) return;
      const reach = channels.reduce((s, c) => s + (c.subscribers_count || 0), 0);
      const categories = new Set(channels.map(c => c.category).filter(Boolean)).size;
      setStats({ channels: channels.length, reach: formatCount(reach) + "+", categories });
    }).catch(() => {});
  }, []);

  const goToDashboard = () => {
    if (!user) { navigate(createPageUrl("Register")); return; }
    if (user.role === "admin") navigate(createPageUrl("AdminDashboard"));
    else if (user.application_role === "channel_owner") navigate(createPageUrl("ChannelOwnerDashboard"));
    else navigate(createPageUrl("AdvertiserDashboard"));
  };

  /* scroll-reveal refs */
  const [statsRef,   statsVisible]   = useInView(0.3);
  const [howRef,     howVisible]     = useInView(0.1);
  const [whyRef,     whyVisible]     = useInView(0.1);
  const [splitRef,   splitVisible]   = useInView(0.1);
  const [ctaRef,     ctaVisible]     = useInView(0.2);

  const steps = [
    { icon: MessageSquare, title: "step1Title", desc: "step1Desc" },
    { icon: Send,          title: "step2Title", desc: "step2Desc" },
    { icon: BadgeCheck,    title: "step3Title", desc: "step3Desc" },
  ];

  const features = [
    { icon: BadgeCheck,  color: "text-blue-600 bg-blue-50",       title: "featVerifiedTitle",   desc: "featVerifiedDesc" },
    { icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50", title: "featModerationTitle", desc: "featModerationDesc" },
    { icon: Users,       color: "text-purple-600 bg-purple-50",   title: "featDualTitle",       desc: "featDualDesc" },
    { icon: Wallet,      color: "text-amber-600 bg-amber-50",     title: "featPricingTitle",    desc: "featPricingDesc" },
    { icon: BarChart3,   color: "text-sky-600 bg-sky-50",         title: "featAnalyticsTitle",  desc: "featAnalyticsDesc" },
    { icon: Globe,       color: "text-rose-600 bg-rose-50",       title: "featBilingualTitle",  desc: "featBilingualDesc" },
  ];

  const advBullets   = ["advBullet1",   "advBullet2",   "advBullet3",   "advBullet4"];
  const ownerBullets = ["ownerBullet1", "ownerBullet2", "ownerBullet3", "ownerBullet4"];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden" dir={isRTL ? "rtl" : "ltr"}>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-slate-950 text-white">

        {/* Static glow blobs */}
        <div className="pointer-events-none absolute -top-44 -left-44 h-[480px] w-[480px] rounded-full bg-blue-600/30 blur-3xl animate-pulse-glow" />
        <div className="pointer-events-none absolute top-10 -right-32 h-[400px] w-[400px] rounded-full bg-indigo-500/25 blur-3xl animate-pulse-glow delay-300" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-[420px] w-[420px] rounded-full bg-purple-600/20 blur-3xl animate-pulse-glow delay-600" />

        {/* Floating orbs */}
        <div className="pointer-events-none absolute top-1/4 left-[10%] h-3 w-3 rounded-full bg-blue-400/60 animate-float delay-200" />
        <div className="pointer-events-none absolute top-1/3 right-[12%] h-2 w-2 rounded-full bg-indigo-300/70 animate-float-slow delay-500" />
        <div className="pointer-events-none absolute bottom-1/4 left-[30%] h-2.5 w-2.5 rounded-full bg-sky-400/50 animate-float delay-100" />
        <div className="pointer-events-none absolute top-[60%] right-[25%] h-1.5 w-1.5 rounded-full bg-purple-400/60 animate-float-slow delay-700" />
        <div className="pointer-events-none absolute top-[20%] left-[50%] h-1 w-1 rounded-full bg-white/40 animate-float delay-400" />
        <div className="pointer-events-none absolute bottom-[30%] right-[10%] h-2 w-2 rounded-full bg-blue-300/50 animate-float-slow delay-900" />

        {/* Rotating ring accent */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full border border-white/5 animate-rotate-slow" />

        <div className="container relative mx-auto px-4 pt-16 pb-24 md:pt-28 md:pb-36 text-center">

          {/* Badge */}
          <div className="animate-fade-up mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-blue-200 backdrop-blur overflow-hidden relative">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            {t("homeBadge")}
          </div>

          {/* Heading */}
          <h1 className="animate-fade-up delay-150 mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            {t("homeHeroTitle1")}{" "}
            <span className="shimmer-text">{t("homeHeroTitle2")}</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-up delay-300 mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg md:text-xl">
            {t("homeHeroSubtitle")}
          </p>

          {/* Buttons */}
          <div className="animate-fade-up delay-500 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              onClick={goToDashboard}
              className="h-12 w-full px-8 text-base font-semibold bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.05] hover:shadow-blue-500/40 active:scale-95 sm:w-auto"
            >
              {user ? t("homeGoToDashboard") : t("getStarted")}
              <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl(user ? "AddChannel" : "Register"))}
              className="h-12 w-full px-8 text-base font-semibold border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:scale-[1.03] transition-all backdrop-blur sm:w-auto"
            >
              <Megaphone className="h-5 w-5" />
              {t("monetizeMyChannel")}
            </Button>
          </div>

          <p className="animate-fade-in delay-700 mt-8 text-sm text-slate-400">
            {t("homeTrustLine")}
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════ */}
      {stats && (
        <section ref={statsRef} className="container relative z-10 mx-auto -mt-12 px-4 md:-mt-16">
          <div className={`grid grid-cols-3 divide-x divide-gray-100 rounded-2xl border border-gray-100 bg-white py-6 shadow-xl shadow-slate-900/5 rtl:divide-x-reverse transition-all duration-700 ${statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <StatItem value={`${stats.channels}+`}  label={t("statsChannels")}   active={statsVisible} />
            <StatItem value={stats.reach}            label={t("statsReach")}      active={statsVisible} />
            <StatItem value={`${stats.categories}+`} label={t("statsCategories")} active={statsVisible} />
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section className="py-20 md:py-28" ref={howRef}>
        <div className="container mx-auto px-4">
          <div className={`mx-auto mb-14 max-w-2xl text-center transition-all duration-700 ${howVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{t("howItWorks")}</h2>
            <p className="mt-4 text-gray-600">{t("howItWorksSubtitle")}</p>
          </div>

          <div className="relative grid gap-8 md:grid-cols-3">
            <div className="pointer-events-none absolute top-10 left-[16%] right-[16%] hidden border-t-2 border-dashed border-blue-200 md:block" />

            {steps.map((step, i) => {
              const Icon = step.icon;
              const delays = ["delay-100", "delay-300", "delay-500"];
              return (
                <div
                  key={i}
                  className={`relative text-center transition-all duration-700 ${delays[i]} ${howVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                  style={{ transitionDelay: howVisible ? `${i * 150}ms` : "0ms" }}
                >
                  <div className="group relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:scale-110 hover:shadow-blue-600/40 hover:shadow-xl cursor-default">
                    <Icon className="h-9 w-9 transition-transform duration-300 group-hover:scale-110" />
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

      {/* ══════════════════════════════════════════
          WHY ADMARKET
      ══════════════════════════════════════════ */}
      <section className="bg-slate-50 py-20 md:py-28" ref={whyRef}>
        <div className="container mx-auto px-4">
          <div className={`mx-auto mb-14 max-w-2xl text-center transition-all duration-700 ${whyVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{t("whyAdMarket")}</h2>
            <p className="mt-4 text-gray-600">{t("whyAdMarketSubtitle")}</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-500 hover:-translate-y-2 hover:border-blue-100 hover:shadow-xl hover:shadow-slate-900/8 cursor-default"
                  style={{
                    opacity: whyVisible ? 1 : 0,
                    transform: whyVisible ? "translateY(0)" : "translateY(24px)",
                    transition: `opacity 0.5s ease, transform 0.5s ease`,
                    transitionDelay: whyVisible ? `${i * 80}ms` : "0ms",
                  }}
                >
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} transition-transform duration-300 group-hover:scale-110`}>
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

      {/* ══════════════════════════════════════════
          FOR ADVERTISERS / CHANNEL OWNERS
      ══════════════════════════════════════════ */}
      <section className="py-20 md:py-28" ref={splitRef}>
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Advertisers */}
            <div
              className="flex flex-col rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white md:p-10 transition-all duration-700"
              style={{
                opacity: splitVisible ? 1 : 0,
                transform: splitVisible ? "translateX(0)" : (isRTL ? "translateX(32px)" : "translateX(-32px)"),
                transition: "opacity 0.7s ease, transform 0.7s ease",
              }}
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur transition-transform hover:scale-110">
                <Megaphone className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold md:text-3xl">{t("forAdvertisers")}</h2>
              <p className="mt-3 text-blue-100">{t("homeAdvDesc")}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {advBullets.map((key, i) => (
                  <li key={key} className="flex items-start gap-3"
                    style={{ opacity: splitVisible ? 1 : 0, transition: `opacity 0.4s ease ${0.3 + i * 0.1}s` }}>
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
                    <span className="text-sm text-blue-50">{t(key)}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => navigate(createPageUrl(user ? "ChannelsList" : "Register"))}
                className="mt-8 h-11 w-full bg-white font-semibold text-blue-700 hover:bg-blue-50 hover:scale-[1.03] transition-all sm:w-auto sm:self-start"
              >
                {t("startAdvertising")}
                <Arrow className="h-4 w-4" />
              </Button>
            </div>

            {/* Channel owners */}
            <div
              className="flex flex-col rounded-3xl bg-gradient-to-br from-purple-600 to-fuchsia-700 p-8 text-white md:p-10 transition-all duration-700"
              style={{
                opacity: splitVisible ? 1 : 0,
                transform: splitVisible ? "translateX(0)" : (isRTL ? "translateX(-32px)" : "translateX(32px)"),
                transition: "opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s",
              }}
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur transition-transform hover:scale-110">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold md:text-3xl">{t("forChannelOwners")}</h2>
              <p className="mt-3 text-purple-100">{t("homeOwnerDesc")}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {ownerBullets.map((key, i) => (
                  <li key={key} className="flex items-start gap-3"
                    style={{ opacity: splitVisible ? 1 : 0, transition: `opacity 0.4s ease ${0.45 + i * 0.1}s` }}>
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-fuchsia-200" />
                    <span className="text-sm text-purple-50">{t(key)}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => navigate(createPageUrl(user ? "AddChannel" : "Register"))}
                className="mt-8 h-11 w-full bg-white font-semibold text-purple-700 hover:bg-purple-50 hover:scale-[1.03] transition-all sm:w-auto sm:self-start"
              >
                {t("becomePartner")}
                <Arrow className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA
      ══════════════════════════════════════════ */}
      <section className="container mx-auto px-4 pb-20 md:pb-28" ref={ctaRef}>
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-16 text-center text-white md:py-20">
          <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl animate-pulse-glow" />
          <div className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl animate-pulse-glow delay-500" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full border border-white/5 animate-rotate-slow" />

          <div
            className="relative transition-all duration-700"
            style={{
              opacity: ctaVisible ? 1 : 0,
              transform: ctaVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
            }}
          >
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
              {t("readyToStart")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-300">{t("joinCommunity")}</p>
            <Button
              onClick={goToDashboard}
              className="mt-8 h-12 px-8 text-base font-semibold bg-blue-500 text-white hover:bg-blue-400 shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.06] hover:shadow-blue-500/50 active:scale-95"
            >
              {user ? t("homeGoToDashboard") : t("createAccount")}
              <Arrow className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="border-t border-slate-800 bg-slate-950 py-14 text-slate-400">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <h3 className="text-xl font-bold text-white">AdMarket</h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed">{t("footerTagline")}</p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">{t("footerProduct")}</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => navigate(createPageUrl("ChannelsList"))} className="transition-colors hover:text-white">{t("footerForAdvertisers")}</button></li>
                <li><button onClick={() => navigate(createPageUrl(user ? "AddChannel" : "Register"))} className="transition-colors hover:text-white">{t("footerForOwners")}</button></li>
                <li><button onClick={() => navigate(createPageUrl("Register"))} className="transition-colors hover:text-white">{t("register")}</button></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">{t("footerLegal")}</h4>
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
