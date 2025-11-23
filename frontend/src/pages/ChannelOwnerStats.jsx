import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { AdRequest } from "@/api/entities";
import { TelegramChannel } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getTranslation } from "@/components/translation/translations";
import { useLanguage } from "@/components/contexts/LanguageContext";
import { ArrowLeft, BarChart2, DollarSign, ListChecks, PieChart, Users, Loader2 } from "lucide-react";
// For charts, you'd typically use a library like Recharts.
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
// For now, I'll create placeholders.

export default function ChannelOwnerStats() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adRequests, setAdRequests] = useState([]);
  const [channels, setChannels] = useState([]);

  // Stats state
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [completedAdsCount, setCompletedAdsCount] = useState(0);
  const [earningsByChannel, setEarningsByChannel] = useState([]);
  const [requestStatusDistribution, setRequestStatusDistribution] = useState({});

  useEffect(() => {
    const fetchDataAndCalculateStats = async () => {
      setLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);

        if (userData.application_role !== "channel_owner" && userData.role !== "admin") {
          navigate(createPageUrl("CompleteProfile"));
          return;
        }

        const channelsData = await TelegramChannel.filter({ owner_id: userData.id });
        setChannels(channelsData);
        const channelIds = channelsData.map(ch => ch.id);

        let allOwnerRequests = [];
        if (channelIds.length > 0) {
          allOwnerRequests = await AdRequest.filter({ channel_id__in: channelIds }, "-created_date");
          setAdRequests(allOwnerRequests); // Store all for potential detailed views
        }

        // Calculate Stats
        const completedRequests = allOwnerRequests.filter(req => req.status === "completed");
        const currentTotalEarnings = completedRequests.reduce((sum, req) => sum + (req.price || 0), 0);
        setTotalEarnings(currentTotalEarnings);
        setCompletedAdsCount(completedRequests.length);

        const earningsMap = {};
        channelsData.forEach(ch => {
            earningsMap[ch.id] = { name: ch.name, earnings: 0, count: 0, subscribers: ch.subscribers_count || 0, price: ch.post_price || 0 };
        });
        completedRequests.forEach(req => {
            if (earningsMap[req.channel_id]) {
                earningsMap[req.channel_id].earnings += (req.price || 0);
                earningsMap[req.channel_id].count += 1;
            }
        });
        setEarningsByChannel(Object.values(earningsMap).sort((a,b) => b.earnings - a.earnings));
        
        const statusDist = allOwnerRequests.reduce((acc, req) => {
            acc[req.status] = (acc[req.status] || 0) + 1;
            return acc;
        }, {});
        setRequestStatusDistribution(statusDist);

      } catch (error) {
        console.error("Error fetching stats data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDataAndCalculateStats();
  }, [navigate]);
  
  const MOCK_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82Ca9D'];


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={() => navigate(createPageUrl("ChannelOwnerDashboard"))} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {getTranslation(language, "backToDashboard")}
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart2 className="h-6 w-6" /> 
          {getTranslation(language, "statistics")}
        </h1>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getTranslation(language, "totalEarnings")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {completedAdsCount} {getTranslation(language, "completedAds").toLowerCase()}
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getTranslation(language, "totalChannels")}</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channels.length}</div>
             <p className="text-xs text-muted-foreground">
                {channels.filter(c => c.is_approved).length} {getTranslation(language, "approved").toLowerCase()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getTranslation(language, "totalAdRequests")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adRequests.length}</div>
            <p className="text-xs text-muted-foreground">
                {adRequests.filter(r => r.status === 'pending' || r.status === 'admin_approved').length} {getTranslation(language, "pending").toLowerCase()}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>{getTranslation(language, "earningsOverTime")}</CardTitle>
            <CardDescription>{getTranslation(language, "monthlyEarningsFromAds")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center">
            {/* Placeholder for Earnings Bar Chart */}
            <div className="text-center text-gray-400">
              <BarChart2 className="h-16 w-16 mx-auto mb-2" />
              <p>{getTranslation(language, "chartDataUnavailableDetailed")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{getTranslation(language, "adPerformanceByChannel")}</CardTitle>
          </CardHeader>
          <CardContent>
            {earningsByChannel.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">{getTranslation(language, "channelName")}</th>
                      <th className="text-right py-2 font-medium">{getTranslation(language, "earnings")}</th>
                      <th className="text-right py-2 font-medium">{getTranslation(language, "adsCompleted")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earningsByChannel.map((chStats, index) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="py-2 truncate max-w-[150px]" title={chStats.name}>{chStats.name}</td>
                        <td className="py-2 text-right">${chStats.earnings.toFixed(2)}</td>
                        <td className="py-2 text-right">{chStats.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">{getTranslation(language, "noCompletedAdsForStats")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{getTranslation(language, "adRequestStatusDistribution")}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {/* Placeholder for Request Status Pie Chart */}
             {Object.keys(requestStatusDistribution).length > 0 ? (
                 <div className="text-center text-gray-400 w-full"> {/* Modified to allow content */}
                    <PieChart className="h-16 w-16 mx-auto mb-2" />
                    <p className="mb-2">{getTranslation(language, "chartDataUnavailableDetailed")}</p>
                    {/* Displaying raw data as fallback */}
                    <div className="text-xs text-left">
                        {Object.entries(requestStatusDistribution).map(([status, count]) =>(
                            <div key={status} className="flex justify-between">
                                <span>{getTranslation(language, status)}:</span>
                                <span>{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
             ) : (
                <p className="text-gray-500 text-center py-4">{getTranslation(language, "noAdRequestsForStats")}</p>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}