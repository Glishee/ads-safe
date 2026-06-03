
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { TelegramChannel } from "@/api/entities";
import { AdRequest } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users,
  MessageSquare,
  Clock,
  Shield,
  ArrowRight,
  CheckCircle,
  Home,
  ExternalLink,
  Eye,
  X,
  Check,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTranslation } from "@/components/translation/translations";
import { useLanguage } from "@/components/contexts/LanguageContext";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);
        
        if (userData.role !== "admin") {
          navigate(createPageUrl("Home"));
          return;
        }
        
        const channelsData = await TelegramChannel.getAll();
        setChannels(channelsData);
        
        const requestsData = await AdRequest.getAll();
        setRequests(requestsData);
        
        const usersData = await User.list("-created_date");
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.message.includes("User not authenticated") || error.status === 401) {
          navigate(createPageUrl("Home"));
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);
  
  const getPendingAdRequests = () => {
    // These are non-suspicious requests waiting for admin or both
    return requests.filter(req => req.status === "pending" && !req.is_suspicious);
  };

  const getSuspiciousRequestsPendingAdminReview = () => {
    return requests.filter(req => req.status === "pending_admin_review" && req.is_suspicious);
  };
  
  const handleAdminApproveSuspiciousRequest = async (requestId) => {
    try {
      await AdRequest.update(requestId, { 
        status: "admin_approved", // Now it's like admin approved a regular request
        admin_approved: true,
        // owner_approved remains false, is_suspicious remains true for records
      });
      const requestsData = await AdRequest.list("-created_date");
      setRequests(requestsData);
    } catch (error) {
      console.error("Error approving suspicious ad request:", error);
    }
  };
  
  const handleAdminApproveRegularRequest = async (requestId) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      const updateData = { admin_approved: true };
      if (request.owner_approved) {
        updateData.status = "approved";
      } else {
        updateData.status = "admin_approved";
      }
      await AdRequest.update(requestId, updateData);
      
      const requestsData = await AdRequest.list("-created_date");
      setRequests(requestsData);
    } catch (error) {
      console.error("Error approving ad request:", error);
    }
  };
  
  const handleAdminRejectRequest = async (requestId, reason = "Not suitable content") => {
    try {
      const userData = await User.me();
      const requestToUpdate = requests.find(r => r.id === requestId); // Find the request to check its current status

      const updatePayload = { 
        status: "rejected",
        rejection_reason: reason,
        rejected_by: userData.id,
        admin_approved: false, 
        owner_approved: false, 
      };

      // If the request was specifically in 'pending_admin_review' (i.e., actively suspicious)
      // and is now being rejected by an admin, mark 'is_suspicious' as false.
      if (requestToUpdate && requestToUpdate.status === "pending_admin_review" && requestToUpdate.is_suspicious) {
        updatePayload.is_suspicious = false; 
      }
      
      await AdRequest.update(requestId, updatePayload);
      
      const requestsData = await AdRequest.list("-created_date");
      setRequests(requestsData);
    } catch (error) {
      console.error("Error rejecting ad request:", error);
    }
  };
  
  const getPendingChannels = () => {
    return channels.filter(channel => !channel.is_approved);
  };
  
  const getPendingRequests = () => {
    return requests.filter(req => req.status === "pending");
  };

  // Placeholder for channel approval/rejection
  const handleChannelApproval = async (channelId, approve) => {
  try {
    if (approve) {
      await TelegramChannel.approve(channelId); // POST /channels/<id>/approve
    } else {
      await TelegramChannel.reject(channelId); // POST /channels/<id>/reject
    }

    const updatedChannels = await TelegramChannel.getAll(); // Перезагружаем список
    setChannels(updatedChannels);
  } catch (error) {
    console.error("Error approving/rejecting channel:", error);
  }
};

  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500">
            {getTranslation(language, "loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {getTranslation(language, "adminDashboard")}
          </h1>
          <p className="text-gray-500 mt-1">
            {language === "en" 
              ? `Welcome back, ${user?.username || user?.full_name}!`
              : `ברוך שובך, ${user?.username || user?.full_name}!`
            }
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => navigate(createPageUrl("Home"))}
          className="flex items-center gap-2 mt-2 md:mt-0"
        >
          <Home className="h-4 w-4" />
          {getTranslation(language, "home")}
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
          <TabsTrigger value="overview">{getTranslation(language, "overview")}</TabsTrigger>
          <TabsTrigger value="channels">{getTranslation(language, "channels")}</TabsTrigger>
          <TabsTrigger value="requests">{getTranslation(language, "adRequests")}</TabsTrigger>
          <TabsTrigger value="users">{getTranslation(language, "users")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-gray-500">{getTranslation(language, "totalUsers")}</CardTitle>
                <Users className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{users.length}</div></CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-gray-500">{getTranslation(language, "totalChannels")}</CardTitle>
                <MessageSquare className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{channels.length}</div></CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-gray-500">{getTranslation(language, "pendingChannels")}</CardTitle>
                <Clock className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{getPendingChannels().length}</div></CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-gray-500">{getTranslation(language, "pendingRequests")}</CardTitle>
                <Clock className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{getPendingRequests().length}</div></CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>{getTranslation(language, "pendingChannels")}</CardTitle>
                {getPendingChannels().length > 0 && 
                  <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl("AdminChannels?status=pending"))}>
                    {getTranslation(language, "viewAll")} ({getPendingChannels().length})
                  </Button>
                }
              </CardHeader>
              <CardContent>
                {getPendingChannels().length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
                    <p className="text-gray-500">{getTranslation(language, "noPendingChannels")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getPendingChannels().slice(0, 5).map(channel => (
                      <div key={channel.id} className="flex items-center justify-between gap-2 border-b pb-3 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 shrink-0">
                            {channel.avatar_url ? (<img src={channel.avatar_url} alt={channel.name} className="w-full h-full object-cover"/>)
                            : (<div className="w-full h-full flex items-center justify-center"><span className="text-blue-600 font-bold">{channel.name?.charAt(0).toUpperCase()}</span></div>)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate" title={channel.name}>{channel.name}</p>
                            <p className="text-xs text-gray-500 truncate">@{channel.admin_username}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 px-2 text-xs" onClick={() => handleChannelApproval(channel.id, false)}>
                            {getTranslation(language, "reject")}
                          </Button>
                          <Button size="sm" className="bg-green-500 hover:bg-green-600 px-2 text-xs" onClick={() => handleChannelApproval(channel.id, true)}>
                            {getTranslation(language, "approve")}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {getPendingChannels().length > 5 && (
                      <Button variant="link" onClick={() => navigate(createPageUrl("AdminChannels?status=pending"))} className="flex items-center gap-1 mt-2 p-0 h-auto">
                        {getTranslation(language, "viewMore")}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>{getTranslation(language, "recentUsers")}</CardTitle>
                {users.length > 0 &&
                  <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl("AdminUsers"))}>
                    {getTranslation(language, "viewAll")} ({users.length})
                  </Button>
                }
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">{getTranslation(language, "noUsersYet")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.slice(0, 5).map(appUser => (
                      <div key={appUser.id} className="flex items-center justify-between gap-2 border-b pb-3 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            {appUser.profile_image ? (<img src={appUser.profile_image} alt={appUser.username || appUser.full_name} className="w-full h-full object-cover rounded-full"/>)
                            : (<Users className="h-5 w-5 text-gray-500" />)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{appUser.username || appUser.full_name}</p>
                            <p className="text-xs text-gray-500 truncate">{appUser.email}</p>
                          </div>
                        </div>
                        <Badge variant={appUser.role === "admin" ? "default" : "secondary"} className={`shrink-0 ${appUser.role === "admin" ? "bg-blue-500 text-white" : ""}`}>
                          {getTranslation(language, appUser.role)}
                        </Badge>
                      </div>
                    ))}
                    {users.length > 5 && (
                      <Button variant="link" onClick={() => navigate(createPageUrl("AdminUsers"))} className="flex items-center gap-1 mt-2 p-0 h-auto">
                        {getTranslation(language, "viewMore")}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="channels">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{getTranslation(language, "channels")} {getTranslation(language, "management")}</CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => navigate(createPageUrl("AdminChannels?status=pending"))}
                >
                  {getTranslation(language, "pendingChannels")}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate(createPageUrl("AdminChannels?status=approved"))}
                >
                  {getTranslation(language, "approvedChannels")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {channels.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{getTranslation(language, "noChannelsYet")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {getTranslation(language, "channel")}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {getTranslation(language, "owner")}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {getTranslation(language, "statistics")}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {getTranslation(language, "status")}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {getTranslation(language, "actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {channels.slice(0, 10).map(channel => {
                        const channelOwner = users.find(u => u.id === channel.owner_id);
                        const statusBadgeColors = {
                          approved: 'bg-green-100 text-green-800',
                          pending: 'bg-yellow-100 text-yellow-800',
                          rejected: 'bg-red-100 text-red-800'
                        };
                        
                        let status = "pending";
                        if (channel.is_approved) status = "approved";
                        if (channel.is_rejected) status = "rejected";
                        
                        return (
                          <tr key={channel.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-md bg-gray-100 overflow-hidden">
                                  {channel.avatar_url ? (
                                    <img className="h-10 w-10 object-cover" src={channel.avatar_url} alt="" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
                                      {channel.name?.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{channel.name}</div>
                                  <div className="text-sm text-gray-500">@{channel.admin_username}</div>
                                  <div className="text-xs text-gray-500">
                                    {getTranslation(language, channel.category)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {channelOwner ? (
                                  <div>
                                    <div>{channelOwner.username || channelOwner.full_name}</div>
                                    <div className="text-sm text-gray-500">{channelOwner.email}</div>
                                  </div>
                                ) : (
                                  <span className="text-gray-500 italic">
                                    {getTranslation(language, "unknownOwner")}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {channel.admin_contact_email && (
                                  <div>
                                    <span className="font-medium">{getTranslation(language, "contactEmail")}:</span> {channel.admin_contact_email}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <div>
                                  <span className="font-medium">{getTranslation(language, "subscribers")}:</span> {channel.subscribers_count?.toLocaleString() || "N/A"}
                                </div>
                                <div>
                                  <span className="font-medium">{getTranslation(language, "adPrice")}:</span> ${channel.post_price?.toFixed(2)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={statusBadgeColors[status] || 'bg-gray-100'}>
                                {getTranslation(language, status)}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-3">
                                <Button 
                                  onClick={() => window.open(channel.telegram_link, "_blank")}
                                  variant="ghost"
                                  size="sm"
                                  title={getTranslation(language, "viewOnTelegram")}
                                >
                                  <ExternalLink className="h-4 w-4 text-gray-500" />
                                </Button>
                                <Button 
                                  onClick={() => navigate(createPageUrl(`AdminChannelDetail?id=${channel.id}`))}
                                  variant="ghost"
                                  size="sm"
                                  title={getTranslation(language, "viewDetails")}
                                >
                                  <Eye className="h-4 w-4 text-blue-500" />
                                </Button>
                                {status === "pending" && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="text-red-500"
                                      title={getTranslation(language, "reject")}
                                      onClick={() => handleChannelApproval(channel.id, false)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="text-green-500"
                                      title={getTranslation(language, "approve")}
                                      onClick={() => handleChannelApproval(channel.id, true)}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
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
              {channels.length > 10 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" onClick={() => navigate(createPageUrl("AdminChannels?status=all"))}>
                    {getTranslation(language, "viewAllChannels")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>{getTranslation(language, "adRequests")} {getTranslation(language, "management")}</CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{getTranslation(language, "noRequestsYet")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                {/* Section for Suspicious Requests Pending Admin Review */}
                {getSuspiciousRequestsPendingAdminReview().length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-red-600 flex items-center gap-2 mb-3">
                      <AlertCircle className="h-5 w-5" />
                      {getTranslation(language, "suspiciousRequestsPendingReview")} ({getSuspiciousRequestsPendingAdminReview().length})
                    </h3>
                    <div className="space-y-4 bg-red-50 p-4 rounded-lg">
                      {getSuspiciousRequestsPendingAdminReview().map(request => {
                        const channel = channels.find(c => c.id === request.channel_id);
                        return (
                          <div key={request.id} className="border-l-4 border-red-500 pl-4 py-2 bg-white rounded shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold">{channel?.name || getTranslation(language, "unknownChannel")}</h4>
                                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{request.ad_text}</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                                    {getTranslation(language, "suspicious")}
                                  </Badge>
                                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                                    {getTranslation(language, "pending_admin_review")}
                                  </Badge>
                                  {request.moderation_info?.categories?.map((category, idx) => (
                                    <Badge key={idx} variant="outline" className="bg-gray-100">
                                      {category}
                                    </Badge>
                                  ))}
                                </div>
                                {request.moderation_info?.explanation && (
                                  <p className="text-xs text-red-600 mt-1">{request.moderation_info.explanation}</p>
                                )}
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-500 border-red-200 hover:bg-red-100"
                                  onClick={() => handleAdminRejectRequest(request.id, request.moderation_info?.explanation || "Prohibited content")}
                                >
                                  {getTranslation(language, "reject")}
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="bg-green-500 hover:bg-green-600"
                                  onClick={() => handleAdminApproveSuspiciousRequest(request.id)}
                                >
                                  {getTranslation(language, "markSafeAndForward")}
                                </Button>
                                 <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => navigate(createPageUrl(`AdRequest?id=${request.id}`))}
                                >
                                  {getTranslation(language, "viewDetails")}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                  <h3 className="text-lg font-medium">
                    {getTranslation(language, "pendingRequests")} ({getPendingAdRequests().length})
                  </h3>
                  {getPendingAdRequests().length === 0 ? (
                    <p className="text-gray-500">{getTranslation(language, "noPendingRequests")}</p>
                  ) : (
                    <div className="space-y-4">
                      {getPendingAdRequests().map(request => {
                        const channel = channels.find(c => c.id === request.channel_id);
                        return (
                          <div key={request.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold">{channel?.name || getTranslation(language, "unknownChannel")}</h4>
                                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{request.ad_text}</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                    {getTranslation(language, "pending")}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {new Date(request.created_date).toLocaleDateString()} • ${request.price?.toFixed(2) || "0.00"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-500 border-red-200 hover:bg-red-50"
                                  onClick={() => handleAdminRejectRequest(request.id)}
                                >
                                  {getTranslation(language, "reject")}
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="bg-green-500 hover:bg-green-600"
                                  onClick={() => handleAdminApproveRegularRequest(request.id)}
                                >
                                  {getTranslation(language, "approve")}
                                </Button>
                                 <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => navigate(createPageUrl(`AdRequest?id=${request.id}`))}
                                >
                                  {getTranslation(language, "viewDetails")}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <h3 className="text-lg font-medium mt-8">{getTranslation(language, "allRequests")}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">{getTranslation(language, "channel")}</th>
                          <th className="text-left py-2 px-4">{getTranslation(language, "advertiser")}</th>
                          <th className="text-left py-2 px-4">{getTranslation(language, "price")}</th>
                          <th className="text-left py-2 px-4">{getTranslation(language, "status")}</th>
                          <th className="text-left py-2 px-4">{getTranslation(language, "date")}</th>
                          <th className="text-left py-2 px-4">{getTranslation(language, "actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map(request => {
                          const channel = channels.find(c => c.id === request.channel_id);
                          const advertiser = users.find(u => u.id === request.advertiser_id);
                          const statusColor = {
                            pending: 'bg-yellow-100 text-yellow-800',
                            pending_admin_review: 'bg-orange-100 text-orange-800',
                            admin_approved: 'bg-blue-100 text-blue-800',
                            owner_approved: 'bg-blue-100 text-blue-800',
                            approved: 'bg-green-100 text-green-800',
                            rejected: 'bg-red-100 text-red-800',
                            completed: 'bg-purple-100 text-purple-800',
                            canceled: 'bg-gray-100 text-gray-800'
                          };
                          
                          return (
                            <tr key={request.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{channel?.name || "-"}</td>
                              <td className="py-3 px-4">{advertiser?.username || advertiser?.full_name || "-"}</td>
                              <td className="py-3 px-4">${request.price?.toFixed(2) || "0.00"}</td>
                              <td className="py-3 px-4">
                                <Badge className={statusColor[request.status] || statusColor.pending_admin_review || 'bg-gray-100'}>
                                  {getTranslation(language, request.status)}
                                  {/* Display (suspicious) only if is_suspicious is true AND status is not pending_admin_review AND status is not rejected */}
                                  {request.is_suspicious && 
                                   request.status !== 'pending_admin_review' && 
                                   request.status !== 'rejected' && 
                                   ` (${getTranslation(language, 'suspicious')}`}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">{new Date(request.created_date).toLocaleDateString()}</td>
                              <td className="py-3 px-4">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => navigate(createPageUrl(`AdRequest?id=${request.id}`))}
                                >
                                  {getTranslation(language, "viewDetails")}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{getTranslation(language, "users")} {getTranslation(language, "management")}</CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{getTranslation(language, "noUsersYet")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {getTranslation(language, "user")}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {getTranslation(language, "role")}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {getTranslation(language, "memberSince")}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {getTranslation(language, "status")}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {getTranslation(language, "actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.slice(0, 10).map(user => {
                        return (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 overflow-hidden">
                                  {user.profile_image ? (
                                    <img className="h-10 w-10 object-cover" src={user.profile_image} alt="" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
                                      {user.username?.charAt(0).toUpperCase() || user.full_name?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.username || user.full_name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={
                                user.role === "admin" ? "bg-blue-100 text-blue-800" : // Platform Admin
                                user.application_role === "channel_owner" ? "bg-purple-100 text-purple-800" : 
                                user.application_role === "advertiser" ? "bg-green-100 text-green-800" :
                                "bg-gray-100 text-gray-800" // Default/User with no app role
                              }>
                                {user.role === "admin" ? getTranslation(language, `adminRole`) : 
                                 user.application_role ? getTranslation(language, `${user.application_role}Role`) :
                                 getTranslation(language, 'userRole') /* Basic user */}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.created_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={user.is_blocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                                {getTranslation(language, user.is_blocked ? "blocked" : "active")}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-3">
                                <Button 
                                  onClick={() => navigate(createPageUrl(`AdminUserDetail?id=${user.id}`))}
                                  variant="ghost"
                                  size="sm"
                                  title={getTranslation(language, "viewDetails")}
                                >
                                  <Eye className="h-4 w-4 text-blue-500" />
                                </Button>
                                {user.role !== "admin" && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className={user.is_blocked ? "text-green-500" : "text-red-500"}
                                    title={getTranslation(language, user.is_blocked ? "unblock" : "block")}
                                    onClick={() => navigate(createPageUrl(`AdminUserDetail?id=${user.id}&action=${user.is_blocked ? "unblock" : "block"}`))}
                                  >
                                    {user.is_blocked ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <X className="h-4 w-4" />
                                    )}
                                  </Button>
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
              {users.length > 10 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" onClick={() => navigate(createPageUrl("AdminUsers"))}>
                    {getTranslation(language, "viewAllUsers")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
