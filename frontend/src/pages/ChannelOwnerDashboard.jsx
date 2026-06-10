import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { TelegramChannel } from "@/api/entities";
import { AdRequest } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Clock,
  CheckCircle,
  ArrowRight,
  MessageSquare,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTranslation } from "@/components/translation/translations";
import { useLanguage } from "@/components/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import StatCard from "@/components/dashboard/stat-card";
// Assuming you might want a simple chart for recent earnings - install and import 'recharts' if not already.
// For now, I'll just make a placeholder for a chart.

export default function ChannelOwnerDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [adRequests, setAdRequests] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);
        
        if (userData.application_role !== "channel_owner" && userData.role !== "admin") {
          navigate(createPageUrl("CompleteProfile"));
          return;
        }
        
        const channelsData = await TelegramChannel.filter({ owner_id: userData.id }, "-created_date");
        setChannels(channelsData);
        
        const channelIds = channelsData.map(channel => channel.id);
        
        if (channelIds.length > 0) {
          const allRequests = await AdRequest.filter(
            { channel_id__in: channelIds }, // Fetch only requests for this owner's channels
            "-created_date"
          ); 
          const filteredRequests = allRequests.filter(req => req.status !== "pending_admin_review");
          setAdRequests(filteredRequests);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (error.message.includes("User not authenticated") || error.status === 401) {
          navigate(createPageUrl("Login"));
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);

  const getTotalEarnings = () => {
    return adRequests
      .filter(req => req.status === "completed")
      .reduce((total, req) => total + (req.price || 0), 0);
  };
  
  const getPendingOwnerActionRequestsCount = () => {
    return adRequests.filter(req => 
      (req.status === "pending" || req.status === "admin_approved") && !req.owner_approved
    ).length;
  };
  
  const getActiveChannelsCount = () => {
    return channels.filter(channel => channel.is_approved).length;
  };

  const handleNavigation = (path) => {
    if (loading) return;
    navigate(createPageUrl(path));
  };
  
  const statusBadgeColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    admin_approved: 'bg-blue-100 text-blue-800 border-blue-200',
    owner_approved: 'bg-sky-100 text-sky-800 border-sky-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    completed: 'bg-purple-100 text-purple-800 border-purple-200',
    canceled: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex justify-between items-center gap-4">
          <div>
            <Skeleton className="h-7 w-52 mb-2" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-9 w-28 shrink-0" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    );
  }

  const recentAdRequests = adRequests.slice(0, 5);
  const displayedChannels = channels.slice(0, 3);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <DashboardHeader
        accent="purple"
        title={getTranslation(language, "channelOwnerDashboard")}
        subtitle={language === "en"
          ? `Welcome back, ${user?.username || user?.full_name}!`
          : `ברוך שובך, ${user?.username || user?.full_name}!`
        }
      >
        <Button
          onClick={() => handleNavigation("AddChannel")}
          className="bg-white text-purple-700 hover:bg-purple-50 font-semibold flex items-center gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          {getTranslation(language, "addChannel")}
        </Button>
      </DashboardHeader>

      {/* Stats Cards — clickable shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={DollarSign}
          color="green"
          label={getTranslation(language, "totalEarnings")}
          value={`₪${getTotalEarnings().toFixed(2)}`}
          hint={getTranslation(language, "fromCompletedAds")}
          onClick={() => handleNavigation("ChannelOwnerStats")}
        />
        <StatCard
          icon={Clock}
          color="yellow"
          label={getTranslation(language, "pendingRequests")}
          value={getPendingOwnerActionRequestsCount()}
          hint={getTranslation(language, "waitingForApproval")}
          onClick={() => handleNavigation("ChannelOwnerAdRequests")}
        />
        <StatCard
          icon={CheckCircle}
          color="purple"
          label={getTranslation(language, "activeChannels")}
          value={getActiveChannelsCount()}
          hint={getTranslation(language, "approvedChannels")}
          onClick={() => handleNavigation("MyChannels")}
        />
      </div>

      {/* Quick View Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">{getTranslation(language, "recentRequests")}</CardTitle>
            {adRequests.length > 0 && (
              <Button variant="outline" size="sm" className="shrink-0 text-xs" onClick={() => handleNavigation("ChannelOwnerAdRequests")}>
                {getTranslation(language, "viewAll")} ({adRequests.length}) <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {recentAdRequests.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{getTranslation(language, "noRequestsYet")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAdRequests.map(request => (
                  <div key={request.id} className="flex items-center justify-between gap-2 border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{channels.find(c => c.id === request.channel_id)?.name || getTranslation(language, "unknownChannel")}</p>
                      <p className="text-xs text-gray-500 truncate" title={request.ad_text}>
                        {request.ad_text}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        ₪{request.price?.toFixed(2)} • {new Date(request.created_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className={`${statusBadgeColors[request.status] || statusBadgeColors.canceled} border text-xs shrink-0`}>
                      {getTranslation(language, request.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">{getTranslation(language, "myChannels")}</CardTitle>
            {channels.length > 0 && (
              <Button variant="outline" size="sm" className="shrink-0 text-xs" onClick={() => handleNavigation("MyChannels")}>
                {getTranslation(language, "viewAll")} ({channels.length}) <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {displayedChannels.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{getTranslation(language, "noChannelsYet")}</p>
                <Button 
                  onClick={() => handleNavigation("AddChannel")}
                  className="mt-4"
                  variant="default"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {getTranslation(language, "addChannel")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedChannels.map(channel => (
                  <div key={channel.id} className="flex items-center justify-between gap-2 border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-blue-50 shrink-0">
                        {channel.avatar_url ? (
                          <img src={channel.avatar_url} alt={channel.name} className="w-full h-full object-cover"/>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-blue-500 font-semibold text-lg">{channel.name?.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate" title={channel.name}>{channel.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          ₪{channel.post_price?.toFixed(2)} • {channel.subscribers_count?.toLocaleString()} {getTranslation(language, "subscribers")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${channel.is_approved ? statusBadgeColors.approved : (channel.is_rejected ? statusBadgeColors.rejected : statusBadgeColors.pending)} border text-xs shrink-0`}>
                      {getTranslation(language, channel.is_approved ? 'approved' : (channel.is_rejected ? 'rejected' : 'pending'))}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}