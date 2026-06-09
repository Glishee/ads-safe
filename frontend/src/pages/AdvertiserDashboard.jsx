
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { AdRequest } from "@/api/entities";
import { TelegramChannel } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getTranslation } from "@/components/translation/translations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  DollarSign,
  Clock,
  CheckCircle,
  ArrowRight,
  MessageSquare,
  Search,
  ListOrdered,
  Home,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { useLanguage } from "@/components/contexts/LanguageContext";

export default function AdvertiserDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [channels, setChannels] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [fetchError, setFetchError] = useState("");
  const [slowLoad, setSlowLoad] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setSlowLoad(true), 5000);
    return () => clearTimeout(t);
  }, [loading]);

  const fetchUserAndRequests = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const userData = await User.me();

      if (userData.role !== "admin" && userData.application_role !== "advertiser") {
        if (userData.application_role === "channel_owner") {
          navigate(createPageUrl("ChannelOwnerDashboard"));
        } else {
          navigate(createPageUrl("Home"));
        }
        return;
      }

      setUser(userData);

      if (!userData?.id) {
        setFetchError("Could not load user ID. Please log out and log in again.");
        return;
      }

      const requestsData = await AdRequest.filter({ advertiser_id: userData.id });
      setRequests(requestsData);

      const channelIds = [...new Set(requestsData.map(req => req.channel_id).filter(Boolean))];
      if (channelIds.length > 0) {
        const fetchedChannels = await TelegramChannel.filter({ is_approved: true });
        const channelsMap = fetchedChannels.reduce((acc, ch) => {
          acc[ch.id] = ch;
          return acc;
        }, {});
        setChannels(channelsMap);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      if (error.status === 401 || error.message?.includes("Unauthorized") || error.message?.includes("User not authenticated")) {
        navigate(createPageUrl("Login"));
      } else {
        setFetchError(error.message || "Failed to load orders");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndRequests();
  }, [navigate]);
  
  const getTotalSpent = () => {
    return requests
      .filter(req => req.status === "completed")
      .reduce((total, req) => total + (req.price || 0), 0);
  };
  
  const getActiveRequests = () => {
    return requests.filter(req => 
      req.status === "pending" || 
      req.status === "admin_approved" || 
      req.status === "owner_approved" ||
      req.status === "approved"
    );
  };
  
  const getCompletedRequests = () => {
    return requests.filter(req => req.status === "completed");
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3 px-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500">{getTranslation(language, "loading")}</p>
          {slowLoad && (
            <p className="text-xs text-amber-600 max-w-xs mx-auto">
              {getTranslation(language, "serverWarmingUp") || "Server is starting up, please wait…"}
            </p>
          )}
        </div>
      </div>
    );
  }

  const statusBadgeColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    admin_approved: 'bg-blue-100 text-blue-800 border-blue-200',
    owner_approved: 'bg-blue-100 text-blue-800 border-blue-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    canceled: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {getTranslation(language, "advertiserDashboard")}
          </h1>
          <p className="text-gray-500 mt-1">
            {language === "en" 
              ? `Welcome back, ${user?.username || user?.full_name}!`
              : `ברוך שובך, ${user?.username || user?.full_name}!`
            }
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("Home"))}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            {getTranslation(language, "home")}
          </Button>
          <Button
            onClick={() => navigate(createPageUrl("ChannelsList"))}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {getTranslation(language, "findChannels")}
          </Button>
        </div>
      </div>

      {fetchError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="flex-1">{fetchError}</span>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-red-300 text-red-700 hover:bg-red-100"
            onClick={fetchUserAndRequests}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:w-[300px] mb-8">
          <TabsTrigger value="overview">
            {getTranslation(language, "overview")}
          </TabsTrigger>
          <TabsTrigger value="orders">
            {getTranslation(language, "myOrders")}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {getTranslation(language, "totalSpent")}
                </CardTitle>
                <DollarSign className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₪{getTotalSpent().toFixed(2)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {getTranslation(language, "activeOrders")}
                </CardTitle>
                <Clock className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getActiveRequests().length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {getTranslation(language, "completedOrders")}
                </CardTitle>
                 <CheckCircle className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getCompletedRequests().length}</div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>
                {getTranslation(language, "recentActivity")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {getTranslation(language, "noOrdersYet")}
                  </p>
                  <Button 
                    onClick={() => navigate(createPageUrl("ChannelsList"))}
                    className="mt-4"
                    variant="outline"
                  >
                    {getTranslation(language, "findChannels")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.slice(0, 5).map(request => (
                    <div key={request.id} className="flex items-center justify-between gap-2 border-b pb-3 last:border-b-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{channels[request.channel_id]?.name || getTranslation(language, "unknownChannel")}</p>
                        <p className="text-sm text-gray-500 truncate">
                          ₪{request.price?.toFixed(2)} • {new Date(request.created_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${statusBadgeColors[request.status] || statusBadgeColors.canceled} border shrink-0`}
                      >
                        {getTranslation(language, request.status)}
                      </Badge>
                    </div>
                  ))}
                  
                  {requests.length > 5 && (
                    <Button 
                      variant="link" 
                      onClick={() => setActiveTab("orders")}
                      className="flex items-center gap-1 mt-2 p-0 h-auto"
                    >
                      {getTranslation(language, "viewAll")}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Placeholder for charts - implement with a charting library if needed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {getTranslation(language, "spendingOverTime")}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <BarChart className="h-16 w-16 text-gray-300" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>
                  {getTranslation(language, "popularChannels")}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                 <ListOrdered className="h-16 w-16 text-gray-300" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>
                {getTranslation(language, "myOrders")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {getTranslation(language, "noOrdersYet")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map(request => (
                    <div key={request.id} className="p-4 border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="font-semibold text-base">
                          {channels[request.channel_id]?.name || getTranslation(language, "unknownChannel")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getTranslation(language, "orderId")}: {request.id.substring(0,8)}...
                        </p>
                        <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                          {request.ad_text}
                        </p>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-2">
                        <div className="flex gap-2 flex-wrap justify-end">
                          <Badge 
                            variant="outline"
                            className={`${statusBadgeColors[request.status]} border w-full sm:w-auto justify-center`}
                          >
                            {getTranslation(language, request.status)}
                          </Badge>
                          
                          {/* Show approval progress indicators */}
                          {request.admin_approved && !request.owner_approved && request.status !== "approved" && request.status !== "completed" && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {getTranslation(language, "adminApproved")}
                            </Badge>
                          )}
                          
                          {!request.admin_approved && request.owner_approved && request.status !== "approved" && request.status !== "completed" && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                              {getTranslation(language, "ownerApproved")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-lg font-bold">₪{request.price?.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(request.created_date).toLocaleDateString()}
                        </p>
                        
                        {/* For rejected requests, show reject reason if available */}
                        {request.status === "rejected" && request.rejection_reason && (
                          <p className="text-xs text-red-500 mt-1">
                            {getTranslation(language, "reason")}: {request.rejection_reason}
                          </p>
                        )}
                        
                        {/* Add view details button */}
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="mt-2"
                          onClick={() => navigate(createPageUrl(`AdRequest?id=${request.id}`))}
                        >
                          {getTranslation(language, "viewDetails")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
