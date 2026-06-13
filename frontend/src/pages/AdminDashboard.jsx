import React, { useState, useEffect } from "react";
import { User, TelegramChannel, AdRequest } from "@/api/entities";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  Users, MessageSquare, Clock, ArrowRight, CheckCircle, Home,
  ExternalLink, Eye, X, Check, AlertCircle, ShieldAlert, Settings,
} from "lucide-react";
import { getTranslation } from "@/components/translation/translations";
import { useLanguage } from "@/components/contexts/LanguageContext";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import StatCard from "@/components/dashboard/stat-card";

/* ── shared helpers ── */

const STATUS_STYLES = {
  pending:              { bg:"bg-amber-50",  text:"text-amber-700",  border:"border-amber-200",  dot:"bg-amber-400"  },
  pending_admin_review: { bg:"bg-orange-50", text:"text-orange-700", border:"border-orange-200", dot:"bg-orange-400" },
  admin_approved:       { bg:"bg-blue-50",   text:"text-blue-700",   border:"border-blue-200",   dot:"bg-blue-400"   },
  owner_approved:       { bg:"bg-sky-50",    text:"text-sky-700",    border:"border-sky-200",    dot:"bg-sky-400"    },
  approved:             { bg:"bg-emerald-50",text:"text-emerald-700",border:"border-emerald-200",dot:"bg-emerald-400"},
  rejected:             { bg:"bg-red-50",    text:"text-red-700",    border:"border-red-200",    dot:"bg-red-400"    },
  completed:            { bg:"bg-purple-50", text:"text-purple-700", border:"border-purple-200", dot:"bg-purple-400" },
  canceled:             { bg:"bg-gray-50",   text:"text-gray-600",   border:"border-gray-200",   dot:"bg-gray-400"   },
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

function UserAvatar({ user: u, size = "sm" }) {
  const dim = size === "sm" ? "h-8 w-8 text-sm" : "h-10 w-10 text-base";
  const letter = u.username?.charAt(0).toUpperCase() || u.full_name?.charAt(0).toUpperCase() || "U";
  if (u.profile_image) return <img src={u.profile_image} className={`${dim} rounded-full object-cover`} alt="" />;
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0`}>
      {letter}
    </div>
  );
}

const TABS = ["overview", "channels", "requests", "users"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [channels, setChannels] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers]       = useState([]);
  const [rejectDialog, setRejectDialog] = useState(null); // { id, reason }


  // Sync active tab with URL so browser back/forward works on mobile
  const activeTab = new URLSearchParams(location.search).get("tab") || "overview";
  const setActiveTab = (tab) => {
    navigate(`${location.pathname}?tab=${tab}`, { replace: false });
  };

  useEffect(() => {
    (async () => {
      try {
        const u = await User.me();
        setUser(u);
        if (u.role !== "admin") { navigate(createPageUrl("Home")); return; }
        const [ch, reqs, us] = await Promise.all([TelegramChannel.getAll(), AdRequest.getAll(), User.list()]);
        setChannels(ch); setRequests(reqs); setUsers(us);
      } catch (err) {
        if (err.status === 401 || err.message?.includes("Unauthorized")) navigate(createPageUrl("Home"));
      } finally { setLoading(false); }
    })();
  }, []);

  /* derived counts */
  const pendingChannels   = channels.filter(c => !c.is_approved && !c.is_rejected);
  const suspicious        = requests.filter(r => r.status === "pending_admin_review" && r.is_suspicious);
  const pendingRegular    = requests.filter(r => r.status === "pending" && !r.is_suspicious);
  const totalActionItems  = pendingChannels.length + suspicious.length + pendingRegular.length;

  /* actions */
  const approveChannel = async (id, approve) => {
    try {
      if (approve) await TelegramChannel.approve(id); else await TelegramChannel.reject(id);
      setChannels(await TelegramChannel.getAll());
    } catch (e) { console.error(e); }
  };

  const approveRegularRequest = async (id) => {
    try {
      const req = requests.find(r => r.id === id);
      const upd = { admin_approved: true, status: req?.owner_approved ? "approved" : "admin_approved" };
      await AdRequest.update(id, upd);
      setRequests(await AdRequest.list());
    } catch (e) { console.error(e); }
  };

  const approveSuspicious = async (id) => {
    try {
      await AdRequest.update(id, { status: "admin_approved", admin_approved: true });
      setRequests(await AdRequest.list());
    } catch (e) { console.error(e); }
  };

  const rejectRequest = async (id, reason) => {
    try {
      const req = requests.find(r => r.id === id);
      await AdRequest.update(id, {
        status: "rejected", rejection_reason: reason || "Rejected by admin",
        admin_approved: false, owner_approved: false,
        ...(req?.status === "pending_admin_review" ? { is_suspicious: false } : {}),
      });
      setRequests(await AdRequest.list());
      setRejectDialog(null);
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-3">
        <div className="relative mx-auto h-12 w-12">
          <div className="absolute inset-0 animate-ping rounded-full bg-slate-200 opacity-60" />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700" />
        </div>
        <p className="text-gray-500 text-sm">{getTranslation(language, "loading")}</p>
      </div>
    </div>
  );

  const tabDefs = [
    { id: "overview",  label: getTranslation(language, "overview"),  badge: totalActionItems || null },
    { id: "channels",  label: getTranslation(language, "manageChannels"), badge: pendingChannels.length || null },
    { id: "requests",  label: getTranslation(language, "adRequests"),  badge: (suspicious.length + pendingRegular.length) || null },
    { id: "users",     label: getTranslation(language, "allUsers") },
  ];

  return (
    <div className="space-y-6">
      <DashboardHeader accent="slate"
        title={getTranslation(language, "adminDashboard")}
        subtitle={language === "en" ? `Welcome back, ${user?.username || user?.full_name}!` : `ברוך שובך, ${user?.username || user?.full_name}!`}
      >
        <Button variant="outline" onClick={() => navigate(createPageUrl("Home"))}
          className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white backdrop-blur gap-2">
          <Home className="h-4 w-4" />{getTranslation(language, "home")}
        </Button>
        <Button variant="outline" onClick={() => navigate(createPageUrl("AdminSettings"))}
          className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white backdrop-blur gap-2">
          <Settings className="h-4 w-4" />{getTranslation(language, "systemSettings")}
        </Button>
      </DashboardHeader>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {tabDefs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors rounded-t-lg
              ${activeTab === tab.id ? "text-blue-600 bg-blue-50/60 border-b-2 border-blue-600 -mb-px" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
            {tab.label}
            {tab.badge ? (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${activeTab === tab.id ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-600"}`}>
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users}         color="blue"   label={getTranslation(language, "totalUsers")}     value={users.length}           onClick={() => setActiveTab("users")} />
            <StatCard icon={MessageSquare} color="purple" label={getTranslation(language, "totalChannels")}  value={channels.length}        onClick={() => setActiveTab("channels")} />
            <StatCard icon={Clock}         color="yellow" label={getTranslation(language, "pendingChannels")} value={pendingChannels.length} onClick={() => setActiveTab("channels")} />
            <StatCard icon={CheckCircle}   color="sky"    label={getTranslation(language, "pendingRequests")} value={pendingRegular.length + suspicious.length} onClick={() => setActiveTab("requests")} />
          </div>

          {/* Action items */}
          {totalActionItems > 0 && (
            <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5 space-y-3">
              <h3 className="flex items-center gap-2 font-semibold text-red-700 text-sm">
                <AlertCircle className="h-4 w-4" />
                {language === "en" ? `${totalActionItems} items need your attention` : `${totalActionItems} פריטים מחכים לטיפולך`}
              </h3>
              <div className="grid sm:grid-cols-3 gap-3">
                {pendingChannels.length > 0 && (
                  <button onClick={() => setActiveTab("channels")}
                    className="flex items-center gap-3 rounded-xl bg-white border border-amber-200 p-3 text-left hover:shadow-sm transition-shadow">
                    <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{pendingChannels.length}</p>
                      <p className="text-xs text-gray-500">{getTranslation(language, "pendingChannels")}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 ml-auto" />
                  </button>
                )}
                {suspicious.length > 0 && (
                  <button onClick={() => setActiveTab("requests")}
                    className="flex items-center gap-3 rounded-xl bg-white border border-red-200 p-3 text-left hover:shadow-sm transition-shadow">
                    <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <ShieldAlert className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{suspicious.length}</p>
                      <p className="text-xs text-gray-500">{getTranslation(language, "suspicious") || "Suspicious"}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 ml-auto" />
                  </button>
                )}
                {pendingRegular.length > 0 && (
                  <button onClick={() => setActiveTab("requests")}
                    className="flex items-center gap-3 rounded-xl bg-white border border-blue-200 p-3 text-left hover:shadow-sm transition-shadow">
                    <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{pendingRegular.length}</p>
                      <p className="text-xs text-gray-500">{getTranslation(language, "pendingRequests")}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 ml-auto" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick views */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pending channels */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-slate-800 text-sm">{getTranslation(language, "pendingChannels")}</h3>
                {pendingChannels.length > 0 && (
                  <button onClick={() => setActiveTab("channels")} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    {getTranslation(language, "viewAll")}<ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
              {pendingChannels.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <CheckCircle className="h-8 w-8 text-emerald-300 mb-2" />
                  <p className="text-sm text-gray-400">{language === "en" ? "All channels reviewed!" : "כל הערוצים עברו בדיקה!"}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {pendingChannels.slice(0, 4).map(ch => (
                    <div key={ch.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {ch.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-800 truncate">{ch.name}</p>
                        <p className="text-xs text-gray-400">{ch.subscribers_count?.toLocaleString()} subs · ₪{ch.post_price?.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => approveChannel(ch.id, false)}
                          className="h-7 w-7 rounded-lg border border-red-200 bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => approveChannel(ch.id, true)}
                          className="h-7 w-7 rounded-lg border border-emerald-200 bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => navigate(createPageUrl(`AdminChannelDetail?id=${ch.id}`))}
                          className="h-7 w-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-blue-500 hover:bg-gray-50 transition-colors">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent users */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-slate-800 text-sm">{getTranslation(language, "recentUsers")}</h3>
                <button onClick={() => setActiveTab("users")} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  {getTranslation(language, "viewAll")}<ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {users.slice(0, 5).map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <UserAvatar user={u} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-800 truncate">{u.username || u.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium shrink-0
                      ${u.role === "admin" ? "bg-blue-100 text-blue-700" : u.application_role === "channel_owner" ? "bg-purple-100 text-purple-700" : u.application_role === "advertiser" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                      {u.role === "admin" ? getTranslation(language, "adminRole") : u.application_role ? getTranslation(language, `${u.application_role}Role`) : getTranslation(language, "userRole")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CHANNELS ── */}
      {activeTab === "channels" && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">{getTranslation(language, "channelsManagement")}</h3>
            <span className="text-xs text-gray-400">{channels.length} {getTranslation(language, "total") || "total"}</span>
          </div>
          {channels.length === 0 ? (
            <div className="py-14 text-center text-gray-400 text-sm">{getTranslation(language, "noChannelsYet")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{getTranslation(language, "channel")}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">{getTranslation(language, "stats")}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{getTranslation(language, "status")}</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{getTranslation(language, "actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {channels.map(ch => {
                    const status = ch.is_approved ? "approved" : ch.is_rejected ? "rejected" : "pending";
                    return (
                      <tr key={ch.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                              {ch.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 truncate max-w-[160px]">{ch.name}</p>
                              <p className="text-xs text-gray-400 truncate max-w-[160px]">{ch.category || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell text-gray-600">
                          <p>{ch.subscribers_count?.toLocaleString() || "—"} {getTranslation(language, "subscribers")}</p>
                          <p className="text-xs text-gray-400">₪{ch.post_price?.toFixed(2)}</p>
                        </td>
                        <td className="px-4 py-3.5"><StatusBadge status={status} language={language} /></td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            {ch.telegram_link && (
                              <button onClick={() => window.open(ch.telegram_link, "_blank")}
                                className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button onClick={() => navigate(createPageUrl(`AdminChannelDetail?id=${ch.id}`))}
                              className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {status === "pending" && (
                              <>
                                <button onClick={() => approveChannel(ch.id, false)}
                                  className="h-7 w-7 rounded-lg border border-red-200 bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => approveChannel(ch.id, true)}
                                  className="h-7 w-7 rounded-lg border border-emerald-200 bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors">
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── REQUESTS ── */}
      {activeTab === "requests" && (
        <div className="space-y-5">
          {/* Suspicious */}
          {suspicious.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50/40 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-red-200">
                <ShieldAlert className="h-4 w-4 text-red-600" />
                <h3 className="font-semibold text-red-700 text-sm">{getTranslation(language, "suspiciousRequestsPendingReview")} ({suspicious.length})</h3>
              </div>
              <div className="divide-y divide-red-100/60">
                {suspicious.map(req => {
                  const ch = channels.find(c => c.id === req.channel_id);
                  return (
                    <div key={req.id} className="px-5 py-4 flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">{ch?.name || getTranslation(language, "unknownChannel")}</p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{req.ad_text}</p>
                        {req.moderation_info?.explanation && (
                          <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{req.moderation_info.explanation}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {req.moderation_info?.categories?.map((cat, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{cat}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-100 gap-1"
                          onClick={() => setRejectDialog({ id: req.id, reason: req.moderation_info?.explanation || "" })}>
                          <X className="h-3.5 w-3.5" />{getTranslation(language, "reject")}
                        </Button>
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 gap-1"
                          onClick={() => approveSuspicious(req.id)}>
                          <Check className="h-3.5 w-3.5" />{getTranslation(language, "markSafeAndForward")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate(createPageUrl(`AdRequest?id=${req.id}`))}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending regular */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-slate-800 text-sm">{getTranslation(language, "pendingRequests")} ({pendingRegular.length})</h3>
            </div>
            {pendingRegular.length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <CheckCircle className="h-8 w-8 text-emerald-300 mb-2" />
                <p className="text-sm text-gray-400">{getTranslation(language, "noPendingRequests")}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pendingRegular.map(req => {
                  const ch = channels.find(c => c.id === req.channel_id);
                  return (
                    <div key={req.id} className="flex flex-col sm:flex-row gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-slate-800 text-sm">{ch?.name || getTranslation(language, "unknownChannel")}</p>
                          <StatusBadge status={req.status} language={language} />
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">{req.ad_text}</p>
                        <p className="text-xs text-gray-400 mt-1">₪{req.price?.toFixed(2)} · {new Date(req.created_date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                          onClick={() => setRejectDialog({ id: req.id, reason: "" })}>
                          <X className="h-3.5 w-3.5" />{getTranslation(language, "reject")}
                        </Button>
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 gap-1"
                          onClick={() => approveRegularRequest(req.id)}>
                          <Check className="h-3.5 w-3.5" />{getTranslation(language, "approve")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate(createPageUrl(`AdRequest?id=${req.id}`))}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* All requests table */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">{getTranslation(language, "allRequests")}</h3>
              <span className="text-xs text-gray-400">{requests.length} {getTranslation(language, "total") || "total"}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {[getTranslation(language,"channel"), getTranslation(language,"advertiser"), getTranslation(language,"price"), getTranslation(language,"status"), getTranslation(language,"date"), ""].map((h, i) => (
                      <th key={i} className={`px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.map(req => {
                    const ch  = channels.find(c => c.id === req.channel_id);
                    const adv = users.find(u => u.id === req.advertiser_id);
                    return (
                      <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{ch?.name || "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{adv?.username || adv?.full_name || "—"}</td>
                        <td className="px-4 py-3 font-semibold">₪{req.price?.toFixed(2) || "0.00"}</td>
                        <td className="px-4 py-3"><StatusBadge status={req.status} language={language} /></td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(req.created_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => navigate(createPageUrl(`AdRequest?id=${req.id}`))}>
                            <Eye className="h-3.5 w-3.5 text-blue-500" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── USERS ── */}
      {activeTab === "users" && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">{getTranslation(language, "usersManagement")}</h3>
            <span className="text-xs text-gray-400">{users.length} {getTranslation(language, "total") || "total"}</span>
          </div>
          {users.length === 0 ? (
            <div className="py-14 text-center text-gray-400 text-sm">{getTranslation(language, "noUsersYet")}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <UserAvatar user={u} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-800 truncate">{u.username || u.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium
                      ${u.role === "admin" ? "bg-blue-100 text-blue-700" : u.application_role === "channel_owner" ? "bg-purple-100 text-purple-700" : u.application_role === "advertiser" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                      {u.role === "admin" ? getTranslation(language, "adminRole") : u.application_role ? getTranslation(language, `${u.application_role}Role`) : getTranslation(language, "userRole")}
                    </span>
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${u.is_blocked ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {getTranslation(language, u.is_blocked ? "blocked" : "active")}
                    </span>
                    <p className="text-xs text-gray-400">{new Date(u.created_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => navigate(createPageUrl(`AdminUserDetail?id=${u.id}`))}
                      className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    {u.role !== "admin" && (
                      <button onClick={() => navigate(createPageUrl(`AdminUserDetail?id=${u.id}&action=${u.is_blocked ? "unblock" : "block"}`))}
                        className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-colors
                          ${u.is_blocked ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50" : "border-red-200 text-red-500 hover:bg-red-50"}`}>
                        {u.is_blocked ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {users.length > 15 && (
            <div className="px-5 py-4 border-t border-gray-100 text-center">
              <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl("AdminUsers"))}>
                {getTranslation(language, "viewAllUsers")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>

      {/* Reject reason dialog */}
      {rejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">{getTranslation(language, "rejectRequest")}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{getTranslation(language, "rejectionReason")}</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                rows={3}
                placeholder={getTranslation(language, "rejectionReasonPlaceholder")}
                value={rejectDialog.reason}
                onChange={e => setRejectDialog(d => ({ ...d, reason: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setRejectDialog(null)}>{getTranslation(language, "cancel")}</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => rejectRequest(rejectDialog.id, rejectDialog.reason)}>
                <X className="h-4 w-4 mr-1" />{getTranslation(language, "reject")}
              </Button>
            </div>
          </div>
        </div>
      )}
  );
}
