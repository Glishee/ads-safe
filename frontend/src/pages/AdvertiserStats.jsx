import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, AdRequest, TelegramChannel } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/contexts/LanguageContext";
import { getTranslation } from "@/components/translation/translations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, DollarSign, ShoppingCart, CheckCircle, Clock, Loader2, BarChart2 } from "lucide-react";

export default function AdvertiserStats() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [channels, setChannels] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const user = await User.me();
        if (user.role !== "admin" && user.application_role !== "advertiser") {
          navigate(createPageUrl("ChannelOwnerDashboard"));
          return;
        }

        const data = await AdRequest.filter({ advertiser_id: user.id });
        setOrders(data);

        const ids = [...new Set(data.map(r => r.channel_id).filter(Boolean))];
        if (ids.length > 0) {
          const chList = await TelegramChannel.filter({ is_approved: true });
          const map = {};
          chList.forEach(ch => { map[ch.id] = ch; });
          setChannels(map);
        }
      } catch (err) {
        if (err.status === 401) navigate(createPageUrl("Login"));
        else setError(err.message || "Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  if (orders.length === 0) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{getTranslation(language, "statistics")}</h1>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BarChart2 className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-500">{getTranslation(language, "noStatsYet")}</p>
      </div>
    </div>
  );

  const totalSpent = orders
    .filter(o => ["approved", "completed"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.price || 0), 0);

  const pending = orders.filter(o => ["pending", "pending_admin_review", "admin_approved", "owner_approved"].includes(o.status)).length;
  const approved = orders.filter(o => o.status === "approved" || o.status === "completed").length;
  const rejected = orders.filter(o => o.status === "rejected" || o.status === "cancelled").length;

  // Group by channel
  const byChannel = {};
  orders.forEach(o => {
    if (!o.channel_id) return;
    if (!byChannel[o.channel_id]) byChannel[o.channel_id] = { count: 0, spent: 0 };
    byChannel[o.channel_id].count += 1;
    if (["approved", "completed"].includes(o.status)) {
      byChannel[o.channel_id].spent += Number(o.price || 0);
    }
  });

  const topChannels = Object.entries(byChannel)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  const statusRows = [
    { key: "pending",  label: getTranslation(language, "pending"),  count: pending,  color: "text-yellow-600", bg: "bg-yellow-50" },
    { key: "approved", label: getTranslation(language, "approved"), count: approved, color: "text-green-600",  bg: "bg-green-50"  },
    { key: "rejected", label: getTranslation(language, "rejected"), count: rejected, color: "text-red-600",   bg: "bg-red-50"    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{getTranslation(language, "statistics")}</h1>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{getTranslation(language, "totalSpent")}</p>
                <p className="text-2xl font-bold">₪{totalSpent.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{getTranslation(language, "ordersCount")}</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{getTranslation(language, "pending")}</p>
                <p className="text-2xl font-bold">{pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{getTranslation(language, "approved")}</p>
                <p className="text-2xl font-bold">{approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{getTranslation(language, "statusBreakdown")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusRows.map(row => (
              <div key={row.key} className={`flex items-center justify-between rounded-lg px-4 py-3 ${row.bg}`}>
                <span className={`text-sm font-medium ${row.color}`}>{row.label}</span>
                <span className={`text-lg font-bold ${row.color}`}>{row.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top channels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{getTranslation(language, "topChannels")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topChannels.length === 0 ? (
              <p className="text-sm text-gray-400">{getTranslation(language, "noOrdersYet")}</p>
            ) : topChannels.map(([chId, stats]) => {
              const ch = channels[chId];
              return (
                <div key={chId} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md overflow-hidden bg-gray-100 shrink-0">
                    {ch?.avatar_url
                      ? <img src={ch.avatar_url} alt={ch.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm">
                          {ch?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ch?.name || chId}</p>
                    <p className="text-xs text-gray-500">
                      {stats.count} {getTranslation(language, "ordersCount").toLowerCase()} · ₪{stats.spent.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
