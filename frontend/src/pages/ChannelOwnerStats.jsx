import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { AdRequest } from "@/api/entities";
import { TelegramChannel } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getTranslation } from "@/components/translation/translations";
import { useLanguage } from "@/components/contexts/LanguageContext";
import { DollarSign, ListChecks, Users, Loader2, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const STATUS_COLORS = {
  completed:            "#22c55e",
  approved:             "#3b82f6",
  admin_approved:       "#60a5fa",
  owner_approved:       "#a78bfa",
  pending:              "#f59e0b",
  rejected:             "#ef4444",
  canceled:             "#9ca3af",
  pending_admin_review: "#f97316",
};

function buildMonthlyData(requests) {
  const map = {};
  requests
    .filter(r => r.status === "completed")
    .forEach(r => {
      const d = new Date(r.created_date || r.created_at);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + (r.price || 0);
    });

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, total]) => {
      const [year, month] = key.split("-");
      const label = new Date(+year, +month - 1).toLocaleString("default", { month: "short", year: "2-digit" });
      return { month: label, earnings: parseFloat(total.toFixed(2)) };
    });
}

function buildStatusData(requests, language) {
  const map = {};
  requests.forEach(r => {
    map[r.status] = (map[r.status] || 0) + 1;
  });
  return Object.entries(map).map(([status, value]) => ({
    name: getTranslation(language, status) || status,
    value,
    status,
  }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow text-sm">
      {label && <p className="font-medium text-gray-700 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: {typeof p.value === "number" && p.name?.toLowerCase().includes("$") === false
            ? p.dataKey === "earnings" ? `$${p.value.toFixed(2)}` : p.value
            : p.value}
        </p>
      ))}
    </div>
  );
};

export default function ChannelOwnerStats() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [adRequests, setAdRequests] = useState([]);
  const [channels, setChannels] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [completedAdsCount, setCompletedAdsCount] = useState(0);
  const [earningsByChannel, setEarningsByChannel] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        localStorage.removeItem("user");
        const userData = await User.me();
        if (userData.application_role !== "channel_owner" && userData.role !== "admin") {
          navigate(createPageUrl("CompleteProfile"));
          return;
        }

        const channelsData = await TelegramChannel.filter({ owner_id: userData.id });
        setChannels(channelsData);
        const channelIds = channelsData.map(ch => ch.id);

        let all = [];
        if (channelIds.length > 0) {
          all = await AdRequest.filter({ channel_id__in: channelIds }, "-created_date");
          setAdRequests(all);
        }

        const completed = all.filter(r => r.status === "completed");
        setTotalEarnings(completed.reduce((s, r) => s + (r.price || 0), 0));
        setCompletedAdsCount(completed.length);

        const map = {};
        channelsData.forEach(ch => {
          map[ch.id] = { name: ch.name, earnings: 0, count: 0 };
        });
        completed.forEach(r => {
          if (map[r.channel_id]) {
            map[r.channel_id].earnings += r.price || 0;
            map[r.channel_id].count += 1;
          }
        });
        setEarningsByChannel(Object.values(map).sort((a, b) => b.earnings - a.earnings));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const monthlyData = buildMonthlyData(adRequests);
  const statusData  = buildStatusData(adRequests, language);
  const pendingCount = adRequests.filter(r => r.status === "pending" || r.status === "admin_approved").length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold">
        {getTranslation(language, "statistics")}
      </h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{getTranslation(language, "totalEarnings")}</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-gray-400">{completedAdsCount} {getTranslation(language, "completedAds")?.toLowerCase()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{getTranslation(language, "totalChannels")}</CardTitle>
            <ListChecks className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channels.length}</div>
            <p className="text-xs text-gray-400">{channels.filter(c => c.is_approved).length} {getTranslation(language, "approved")?.toLowerCase()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{getTranslation(language, "totalAdRequests")}</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adRequests.length}</div>
            <p className="text-xs text-gray-400">{pendingCount} {getTranslation(language, "pending")?.toLowerCase()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            {getTranslation(language, "earningsOverTime")}
          </CardTitle>
          <CardDescription>{getTranslation(language, "monthlyEarningsFromAds")}</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} width={52} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="earnings" name="Earnings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              {getTranslation(language, "chartDataUnavailable")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pie + Channel table side-by-side on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{getTranslation(language, "adRequestStatusDistribution")}</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="45%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={STATUS_COLORS[entry.status] || "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                {getTranslation(language, "noAdRequestsForStats")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Channel performance table */}
        <Card>
          <CardHeader>
            <CardTitle>{getTranslation(language, "adPerformanceByChannel")}</CardTitle>
          </CardHeader>
          <CardContent>
            {earningsByChannel.length > 0 ? (
              <div className="space-y-3">
                {earningsByChannel.map((ch, i) => {
                  const pct = totalEarnings > 0 ? (ch.earnings / totalEarnings) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="truncate max-w-[60%] font-medium" title={ch.name}>{ch.name}</span>
                        <span className="text-gray-500 shrink-0">${ch.earnings.toFixed(2)} · {ch.count} ads</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                {getTranslation(language, "noCompletedAdsForStats")}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
