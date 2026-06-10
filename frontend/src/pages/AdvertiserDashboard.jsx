import React, { useState, useEffect } from "react";
import { User, AdRequest, TelegramChannel } from "@/api/entities";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getTranslation } from "@/components/translation/translations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, Clock, CheckCircle, ArrowRight, MessageSquare,
  Search, Home, AlertCircle, RefreshCw, TrendingUp, ExternalLink,
} from "lucide-react";
import { useLanguage } from "@/components/contexts/LanguageContext";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import StatCard from "@/components/dashboard/stat-card";

const STATUS_STYLES = {
  pending:        { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-400"  },
  admin_approved: { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-400"   },
  owner_approved: { bg: "bg-sky-50",    text: "text-sky-700",    border: "border-sky-200",    dot: "bg-sky-400"    },
  approved:       { bg: "bg-emerald-50",text: "text-emerald-700",border: "border-emerald-200",dot: "bg-emerald-400"},
  rejected:       { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    dot: "bg-red-400"    },
  completed:      { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-400" },
  canceled:       { bg: "bg-gray-50",   text: "text-gray-600",   border: "border-gray-200",   dot: "bg-gray-400"   },
};

const STATUS_LEFT_BORDER = {
  pending:        "border-l-amber-400",
  admin_approved: "border-l-blue-400",
  owner_approved: "border-l-sky-400",
  approved:       "border-l-emerald-400",
  rejected:       "border-l-red-400",
  completed:      "border-l-purple-400",
  canceled:       "border-l-gray-300",
};

function StatusBadge({ status, language }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.canceled;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text} ${s.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {getTranslation(language, status)}
    </span>
  );
}

export default function AdvertiserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [channels, setChannels] = useState({});
  const [fetchError, setFetchError] = useState("");
  const [slowLoad, setSlowLoad] = useState(false);

  // URL-synced tab — back/forward navigation works on mobile
  const activeTab = new URLSearchParams(location.search).get("tab") || "overview";
  const setActiveTab = (tab) => navigate(`${location.pathname}?tab=${tab}`, { replace: false });

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setSlowLoad(true), 5000);
    return () => clearTimeout(t);
  }, [loading]);

  const fetchData = async () => {
    setLoading(true); setFetchError("");
    try {
      const userData = await User.me();
      if (userData.role !== "admin" && userData.application_role !== "advertiser") {
        navigate(createPageUrl(userData.application_role === "channel_owner" ? "ChannelOwnerDashboard" : "Home"));
        return;
      }
      setUser(userData);
      const reqs = await AdRequest.filter({ advertiser_id: userData.id });
      setRequests(reqs);
      const ids = [...new Set(reqs.map(r => r.channel_id).filter(Boolean))];
      if (ids.length) {
        const all = await TelegramChannel.filter({ is_approved: true });
        setChannels(all.reduce((m, c) => { m[c.id] = c; return m; }, {}));
      }
    } catch (err) {
      if (err.status === 401 || err.message?.includes("Unauthorized")) navigate(createPageUrl("Login"));
      else setFetchError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalSpent    = requests.filter(r => r.status === "completed").reduce((s, r) => s + (r.price || 0), 0);
  const activeReqs    = requests.filter(r => ["pending","admin_approved","owner_approved","approved"].includes(r.status));
  const completedReqs = requests.filter(r => r.status === "completed");

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-3 px-6">
        <div className="relative mx-auto h-12 w-12">
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-200 opacity-60" />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
        <p className="text-gray-500 text-sm">{getTranslation(language, "loading")}</p>
        {slowLoad && <p className="text-xs text-amber-600 max-w-xs mx-auto">{getTranslation(language, "serverWarmingUp") || "Server is starting up…"}</p>}
      </div>
    </div>
  );

  const tabs = [
    { id: "overview", label: getTranslation(language, "overview") },
    { id: "orders",   label: getTranslation(language, "myOrders"), count: requests.length },
  ];

  return (
    <div className="space-y-6">
      <DashboardHeader accent="blue"
        title={getTranslation(language, "advertiserDashboard")}
        subtitle={language === "en" ? `Welcome back, ${user?.username || user?.full_name}!` : `ברוך שובך, ${user?.username || user?.full_name}!`}
      >
        <Button variant="outline" onClick={() => navigate(createPageUrl("Home"))}
          className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white backdrop-blur gap-2">
          <Home className="h-4 w-4" />{getTranslation(language, "home")}
        </Button>
        <Button onClick={() => navigate(createPageUrl("ChannelsList"))}
          className="bg-white text-blue-700 hover:bg-blue-50 font-semibold gap-2">
          <Search className="h-4 w-4" />{getTranslation(language, "findChannels")}
        </Button>
      </DashboardHeader>

      {fetchError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="flex-1">{fetchError}</span>
          <Button size="sm" variant="outline" className="shrink-0 border-red-300 text-red-700 hover:bg-red-100 gap-1" onClick={fetchData}>
            <RefreshCw className="h-3.5 w-3.5" />Retry
          </Button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={DollarSign} color="green"  label={getTranslation(language, "totalSpent")}      value={`₪${totalSpent.toFixed(2)}`}     onClick={() => navigate(createPageUrl("AdvertiserStats"))} />
        <StatCard icon={Clock}       color="blue"   label={getTranslation(language, "activeOrders")}   value={activeReqs.length}                onClick={() => setActiveTab("orders")} />
        <StatCard icon={CheckCircle} color="purple" label={getTranslation(language, "completedOrders")} value={completedReqs.length}            onClick={() => setActiveTab("orders")} />
      </div>

      {/* Custom tabs */}
      <div>
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg gap-2 flex items-center
                ${activeTab === tab.id ? "text-blue-600 bg-blue-50/60 border-b-2 border-blue-600 -mb-px" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
              {tab.label}
              {tab.count != null && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${activeTab === tab.id ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick action bar */}
            {activeReqs.length > 0 && (
              <div className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                <TrendingUp className="h-5 w-5 text-blue-500 shrink-0" />
                <p className="text-sm text-blue-700 flex-1">
                  {language === "en"
                    ? `You have ${activeReqs.length} active order${activeReqs.length > 1 ? "s" : ""} in progress.`
                    : `יש לך ${activeReqs.length} הזמנות פעילות בתהליך.`}
                </p>
                <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-100 shrink-0 gap-1" onClick={() => setActiveTab("orders")}>
                  {getTranslation(language, "viewAll")}<ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* Recent activity */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-slate-800">{getTranslation(language, "recentActivity")}</h3>
                {requests.length > 5 && (
                  <button onClick={() => setActiveTab("orders")} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    {getTranslation(language, "viewAll")}<ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                    <MessageSquare className="h-7 w-7 text-blue-400" />
                  </div>
                  <p className="font-medium text-slate-700 mb-1">{getTranslation(language, "noOrdersYet")}</p>
                  <p className="text-sm text-gray-400 mb-5">{language === "en" ? "Find a channel and place your first ad." : "מצא ערוץ ופרסם את המודעה הראשונה שלך."}</p>
                  <Button onClick={() => navigate(createPageUrl("ChannelsList"))} className="gap-2">
                    <Search className="h-4 w-4" />{getTranslation(language, "findChannels")}
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {requests.slice(0, 6).map(req => (
                    <div key={req.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                      <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 font-bold text-blue-600 text-sm">
                        {channels[req.channel_id]?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-800 truncate">{channels[req.channel_id]?.name || getTranslation(language, "unknownChannel")}</p>
                        <p className="text-xs text-gray-400">{new Date(req.created_date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-semibold text-slate-700">₪{req.price?.toFixed(2)}</span>
                        <StatusBadge status={req.status} language={language} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-slate-800">{getTranslation(language, "myOrders")}</h3>
            </div>
            {requests.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                  <MessageSquare className="h-7 w-7 text-gray-300" />
                </div>
                <p className="text-gray-500">{getTranslation(language, "noOrdersYet")}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {requests.map(req => (
                  <div key={req.id} className={`flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 border-l-[3px] hover:bg-gray-50/50 transition-colors ${STATUS_LEFT_BORDER[req.status] || "border-l-gray-200"}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-800">{channels[req.channel_id]?.name || getTranslation(language, "unknownChannel")}</p>
                        <StatusBadge status={req.status} language={language} />
                      </div>
                      <p className="text-xs text-gray-400 mb-1">ID: {req.id?.substring(0,8)}…</p>
                      <p className="text-sm text-gray-600 line-clamp-1">{req.ad_text}</p>
                      {req.status === "rejected" && req.rejection_reason && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />{getTranslation(language, "reason")}: {req.rejection_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">₪{req.price?.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{new Date(req.created_date).toLocaleDateString()}</p>
                      </div>
                      <Button size="sm" variant="outline" className="gap-1.5 shrink-0"
                        onClick={() => navigate(createPageUrl(`AdRequest?id=${req.id}`))}>
                        <ExternalLink className="h-3.5 w-3.5" />{getTranslation(language, "viewDetails")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
