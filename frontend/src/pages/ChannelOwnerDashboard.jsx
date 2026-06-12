import React, { useState, useEffect } from "react";
import { User, TelegramChannel, AdRequest } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  DollarSign, Clock, CheckCircle, ArrowRight, MessageSquare,
  Plus, Users, TrendingUp, AlertTriangle,
} from "lucide-react";
import { getTranslation } from "@/components/translation/translations";
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

function StatusBadge({ status, language }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.canceled;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text} ${s.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {getTranslation(language, status)}
    </span>
  );
}

function ChannelAvatar({ channel }) {
  if (channel.avatar_url) {
    return <img src={channel.avatar_url} alt={channel.name} className="w-10 h-10 rounded-xl object-cover" />;
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center text-white font-bold text-base shrink-0">
      {channel.name?.charAt(0).toUpperCase() || "C"}
    </div>
  );
}

export default function ChannelOwnerDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [adRequests, setAdRequests] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        if (userData.application_role !== "channel_owner" && userData.role !== "admin") {
          navigate(createPageUrl("Home")); return;
        }
        const ch = await TelegramChannel.filter({ owner_id: userData.id });
        setChannels(ch);
        if (ch.length) {
          const reqs = await AdRequest.filter({ channel_id__in: ch.map(c => c.id) });
          setAdRequests(reqs.filter(r => r.status !== "pending_admin_review" && r.status !== "pending"));
        }
      } catch (err) {
        if (err.status === 401 || err.message?.includes("User not authenticated")) navigate(createPageUrl("Login"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalEarnings = adRequests.filter(r => r.status === "completed").reduce((s, r) => s + (r.price || 0), 0);
  const pendingCount  = adRequests.filter(r => r.status === "admin_approved" && !r.owner_approved).length;
  const activeCount   = channels.filter(c => c.is_approved).length;
  const actionNeeded  = adRequests.filter(r => r.status === "admin_approved" && !r.owner_approved);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-3">
        <div className="relative mx-auto h-12 w-12">
          <div className="absolute inset-0 animate-ping rounded-full bg-purple-200 opacity-60" />
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
        </div>
        <p className="text-gray-500 text-sm">{getTranslation(language, "loading")}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <DashboardHeader accent="purple"
        title={getTranslation(language, "channelOwnerDashboard")}
        subtitle={language === "en" ? `Welcome back, ${user?.username || user?.full_name}!` : `ברוך שובך, ${user?.username || user?.full_name}!`}
      >
        <Button onClick={() => navigate(createPageUrl("AddChannel"))}
          className="bg-white text-purple-700 hover:bg-purple-50 font-semibold gap-2">
          <Plus className="h-4 w-4" />{getTranslation(language, "addChannel")}
        </Button>
      </DashboardHeader>

      {/* Action needed alert */}
      {actionNeeded.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {language === "en" ? `${actionNeeded.length} ad request${actionNeeded.length > 1 ? "s" : ""} need your approval` : `${actionNeeded.length} בקשות פרסום מחכות לאישורך`}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">{language === "en" ? "Admin approved — review and decide." : "האדמין אישר — בדוק ותחליט."}</p>
          </div>
          <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0 gap-1"
            onClick={() => navigate(createPageUrl("ChannelOwnerAdRequests"))}>
            {getTranslation(language, "viewAll")}<ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={DollarSign}  color="green"  label={getTranslation(language, "totalEarnings")}   value={`₪${totalEarnings.toFixed(2)}`} hint={getTranslation(language, "fromCompletedAds")}   onClick={() => navigate(createPageUrl("ChannelOwnerStats"))} />
        <StatCard icon={Clock}       color="yellow" label={getTranslation(language, "pendingRequests")} value={pendingCount}                   hint={getTranslation(language, "waitingForApproval")} onClick={() => navigate(createPageUrl("ChannelOwnerAdRequests"))} />
        <StatCard icon={CheckCircle} color="purple" label={getTranslation(language, "activeChannels")}  value={activeCount}                   hint={getTranslation(language, "approvedChannels")}   onClick={() => navigate(createPageUrl("MyChannels"))} />
      </div>

      {/* Two-column cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent requests */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-500" />
              <h3 className="font-semibold text-slate-800 text-sm">{getTranslation(language, "recentRequests")}</h3>
            </div>
            {adRequests.length > 0 && (
              <button onClick={() => navigate(createPageUrl("ChannelOwnerAdRequests"))}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                {getTranslation(language, "viewAll")} ({adRequests.length})<ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>

          {adRequests.length === 0 ? (
            <div className="flex flex-col items-center py-12 px-4 text-center">
              <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-3">
                <MessageSquare className="h-6 w-6 text-purple-300" />
              </div>
              <p className="text-sm text-gray-500">{getTranslation(language, "noRequestsYet")}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {adRequests.slice(0, 5).map(req => (
                <div key={req.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {channels.find(c => c.id === req.channel_id)?.name || getTranslation(language, "unknownChannel")}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{req.ad_text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">₪{req.price?.toFixed(2)} · {new Date(req.created_date).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={req.status} language={language} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My channels */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <h3 className="font-semibold text-slate-800 text-sm">{getTranslation(language, "myChannels")}</h3>
            </div>
            {channels.length > 0 && (
              <button onClick={() => navigate(createPageUrl("MyChannels"))}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                {getTranslation(language, "viewAll")} ({channels.length})<ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>

          {channels.length === 0 ? (
            <div className="flex flex-col items-center py-12 px-4 text-center">
              <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-3">
                <MessageSquare className="h-6 w-6 text-purple-300" />
              </div>
              <p className="text-sm text-gray-500 mb-4">{getTranslation(language, "noChannelsYet")}</p>
              <Button size="sm" onClick={() => navigate(createPageUrl("AddChannel"))} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />{getTranslation(language, "addChannel")}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {channels.slice(0, 4).map(ch => {
                const chStatus = ch.is_approved ? "approved" : ch.is_rejected ? "rejected" : "pending";
                const s = STATUS_STYLES[chStatus];
                return (
                  <div key={ch.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                    <ChannelAvatar channel={ch} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-800 truncate">{ch.name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                        <Users className="h-3 w-3" />{ch.subscribers_count?.toLocaleString() || "0"}
                        <span>·</span>
                        <span>₪{ch.post_price?.toFixed(2)}</span>
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium shrink-0 ${s.bg} ${s.text} ${s.border}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {getTranslation(language, chStatus)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
