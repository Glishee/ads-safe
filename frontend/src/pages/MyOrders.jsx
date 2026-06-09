import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, AdRequest, TelegramChannel } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/contexts/LanguageContext";
import { getTranslation } from "@/components/translation/translations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ShoppingCart, ExternalLink, Loader2 } from "lucide-react";

const STATUS_COLORS = {
  pending:              "bg-yellow-100 text-yellow-800 border-yellow-200",
  pending_admin_review: "bg-orange-100 text-orange-800 border-orange-200",
  admin_approved:       "bg-blue-100 text-blue-800 border-blue-200",
  owner_approved:       "bg-blue-100 text-blue-800 border-blue-200",
  approved:             "bg-green-100 text-green-800 border-green-200",
  rejected:             "bg-red-100 text-red-800 border-red-200",
  cancelled:            "bg-gray-100 text-gray-600 border-gray-200",
  completed:            "bg-green-100 text-green-800 border-green-200",
};

const STATUS_TABS = ["all", "pending", "approved", "rejected"];

export default function MyOrders() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [channels, setChannels] = useState({});
  const [tab, setTab] = useState("all");
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
        else setError(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const filtered = orders.filter(o => {
    if (tab === "all") return true;
    if (tab === "pending") return ["pending", "pending_admin_review", "admin_approved", "owner_approved"].includes(o.status);
    if (tab === "approved") return o.status === "approved" || o.status === "completed";
    if (tab === "rejected") return o.status === "rejected" || o.status === "cancelled";
    return true;
  });

  const statusLabel = (status) => getTranslation(language, status) || status;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{getTranslation(language, "myOrders")}</h1>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {STATUS_TABS.map(t => (
            <TabsTrigger key={t} value={t}>
              {getTranslation(language, t === "all" ? "all" : t)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingCart className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500">{getTranslation(language, "noOrdersYet")}</p>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => navigate(createPageUrl("ChannelsList"))}>
            {getTranslation(language, "browseChannels")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const channel = channels[order.channel_id];
            return (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    {/* Channel avatar */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {channel?.avatar_url
                        ? <img src={channel.avatar_url} alt={channel.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-lg">
                            {channel?.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                      }
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-sm truncate">
                          {channel?.name || order.channel_id}
                        </span>
                        <Badge variant="outline" className={`text-xs border ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                          {statusLabel(order.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{order.ad_text}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        <span>₪{Number(order.price || 0).toFixed(2)}</span>
                        {order.created_at && (
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        )}
                      </div>
                      {order.rejection_reason && (
                        <p className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                          {order.rejection_reason}
                        </p>
                      )}
                    </div>

                    {/* Channel link */}
                    {channel?.telegram_link && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 self-start"
                        onClick={() => window.open(channel.telegram_link, "_blank")}
                        title={getTranslation(language, "viewOnTelegram")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
