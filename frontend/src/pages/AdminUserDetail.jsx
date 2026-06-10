
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { TelegramChannel } from "@/api/entities";
import { AdRequest } from "@/api/entities";
import { getTranslation } from "@/components/translation/translations";
import { useLanguage } from "@/components/contexts/LanguageContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  AlertCircle, 
  ArrowLeft, 
  Calendar,
  Check, 
  Mail, 
  MessageSquare,
  Shield,
  User as UserIcon,
  Users,
  X,
  ExternalLink,
  Clock,
  DollarSign,
  Phone
} from "lucide-react";

export default function AdminUserDetail() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [channels, setChannels] = useState([]);
  const [adRequests, setAdRequests] = useState([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [success, setSuccess] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Verify current user is admin
        const adminData = await User.me();
        if (adminData.role !== "admin") {
          navigate(createPageUrl("Home"));
          return;
        }
        
        // Get user ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get("id");
        const action = urlParams.get("action"); // "block" or "unblock"
        
        if (!userId) {
          setError(getTranslation(language, "missingUserId"));
          return;
        }
        
        // Find user from all users
        const allUsers = await User.list();
        const userData = allUsers.find(u => u.id === userId);
        
        if (!userData) {
          setError(getTranslation(language, "userNotFound"));
          return;
        }
        
        setUser(userData);
        
        // Check if block/unblock action was requested
        if (action === "block" || action === "unblock") {
          setConfirmDialogOpen(true);
        }
        
        // If user is channel owner, fetch their channels
        if (userData.application_role === "channel_owner") {
          try {
            const allChannels = await TelegramChannel.list("-created_date");
            const userChannels = allChannels.filter(ch => ch.owner_id === userId);
            setChannels(userChannels);
          } catch (err) {
            console.error("Error fetching channels:", err);
          }
        }
        
        // Fetch ad requests related to user (as advertiser)
        try {
          const allRequests = await AdRequest.list("-created_date");
          const userRequests = allRequests.filter(req => req.advertiser_id === userId);
          setAdRequests(userRequests);
        } catch (err) {
          console.error("Error fetching ad requests:", err);
        }
        
      } catch (err) {
        console.error("Error loading user data:", err);
        setError(getTranslation(language, "errorLoadingUserData"));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate, language]);
  
  const handleToggleBlock = async () => {
    if (!user) return;
    
    setUpdating(true);
    setError("");
    setSuccess("");
    
    try {
      await User.update(user.id, { is_blocked: !user.is_blocked });
      
      setSuccess(
        user.is_blocked 
          ? getTranslation(language, "userUnblockedSuccess") 
          : getTranslation(language, "userBlockedSuccess")
      );
      
      // Update local state
      setUser({
        ...user,
        is_blocked: !user.is_blocked
      });
    } catch (err) {
      console.error("Error updating user:", err);
      setError(getTranslation(language, "errorUpdatingUser"));
    } finally {
      setUpdating(false);
      setConfirmDialogOpen(false);
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
  
  if (error || !user) {
    return (
      <div className="container mx-auto py-8 max-w-5xl">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || getTranslation(language, "userNotFound")}</AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          {getTranslation(language, "goBack")}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate(createPageUrl("AdminUsers"))}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          {getTranslation(language, "backToUsers")}
        </Button>
        
        <div className="flex items-center gap-2">
          <Badge className={
            user.role === "admin" ? "bg-blue-100 text-blue-800" :
            user.application_role === "channel_owner" ? "bg-purple-100 text-purple-800" :
            "bg-green-100 text-green-800"
          }>
            {user.role === "admin"
              ? getTranslation(language, "adminRole")
              : getTranslation(language, user.application_role ? `${user.application_role}Role` : "userRole")}
          </Badge>
          
          <Badge className={user.is_blocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
            {getTranslation(language, user.is_blocked ? "blocked" : "active")}
          </Badge>
        </div>
      </div>
      
      {success && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">
            {user.username || user.full_name}
          </h1>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="details">{getTranslation(language, "details")}</TabsTrigger>
              {user.application_role === "channel_owner" && (
                <TabsTrigger value="channels">{getTranslation(language, "channels")}</TabsTrigger>
              )}
              {(user.application_role === "advertiser" || user.application_role === "channel_owner") && (
                <TabsTrigger value="adRequests">{getTranslation(language, "adRequests")}</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>{getTranslation(language, "userDetails")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 pb-4 border-b">
                    <div className="md:w-1/4">
                      <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 mx-auto">
                        {user.profile_image ? (
                          <img 
                            src={user.profile_image} 
                            alt={user.username || user.full_name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-100">
                            <UserIcon className="h-16 w-16 text-blue-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-xl font-semibold">{user.username || user.full_name}</h3>
                        <p className="text-gray-500">{user.email}</p>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-gray-400" />
                          <div className="text-sm">
                            <div className="text-gray-500">{getTranslation(language, "role")}</div>
                            <div className="font-medium">
                              {user.role === "admin"
                                ? getTranslation(language, "adminRole")
                                : getTranslation(language, user.application_role ? `${user.application_role}Role` : "userRole")}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div className="text-sm">
                            <div className="text-gray-500">{getTranslation(language, "memberSince")}</div>
                            <div className="font-medium">
                              {new Date(user.created_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">{getTranslation(language, "accountDetails")}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          {getTranslation(language, "accountActivity")}
                        </h4>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <span>{getTranslation(language, "lastLogin")}</span>
                            <span className="text-gray-700">
                              {user.last_login ? new Date(user.last_login).toLocaleDateString() : getTranslation(language, "never")}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>{getTranslation(language, "status")}</span>
                            <Badge className={user.is_blocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                              {getTranslation(language, user.is_blocked ? "blocked" : "active")}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          {getTranslation(language, "contactInformation")}
                        </h4>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {user.role !== "admin" && (
                    <div className="flex justify-end mt-4">
                      <Button
                        variant={user.is_blocked ? "default" : "destructive"}
                        onClick={() => setConfirmDialogOpen(true)}
                        className={user.is_blocked ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {user.is_blocked ? (
                          <><Check className="h-4 w-4 mr-2" />{getTranslation(language, "unblockUser")}</>
                        ) : (
                          <><X className="h-4 w-4 mr-2" />{getTranslation(language, "blockUser")}</>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {user.application_role === "channel_owner" && (
              <TabsContent value="channels">
                <Card>
                  <CardHeader>
                    <CardTitle>{getTranslation(language, "userChannels")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {channels.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">{getTranslation(language, "noChannelsYet")}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {channels.map(channel => (
                          <div key={channel.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-md overflow-hidden bg-blue-100">
                                  {channel.avatar_url ? (
                                    <img src={channel.avatar_url} alt={channel.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <span className="text-blue-600 font-bold">{channel.name?.charAt(0).toUpperCase()}</span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-medium">{channel.name}</h3>
                                  <div className="text-sm text-gray-500">@{channel.admin_username}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className={
                                      channel.is_approved ? "bg-green-100 text-green-800" : 
                                      channel.is_rejected ? "bg-red-100 text-red-800" : 
                                      "bg-yellow-100 text-yellow-800"
                                    }>
                                      {getTranslation(language, 
                                        channel.is_approved ? "approved" : 
                                        channel.is_rejected ? "rejected" : "pending"
                                      )}
                                    </Badge>
                                    <Badge variant="outline">
                                      <Users className="mr-1 h-3 w-3" />
                                      {channel.subscribers_count?.toLocaleString() || "N/A"} 
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(channel.telegram_link, "_blank")}
                                  className="flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  {getTranslation(language, "viewOnTelegram")}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => navigate(createPageUrl(`AdminChannelDetail?id=${channel.id}`))}
                                >
                                  {getTranslation(language, "details")}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            
            <TabsContent value="adRequests">
              <Card>
                <CardHeader>
                  <CardTitle>{getTranslation(language, "userAdRequests")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {adRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">{getTranslation(language, "noAdRequestsYet")}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {adRequests.map(request => {
                        const statusColors = {
                          pending: 'bg-yellow-100 text-yellow-800',
                          admin_approved: 'bg-blue-100 text-blue-800',
                          owner_approved: 'bg-blue-100 text-blue-800',
                          approved: 'bg-green-100 text-green-800',
                          rejected: 'bg-red-100 text-red-800',
                          completed: 'bg-purple-100 text-purple-800',
                          canceled: 'bg-gray-100 text-gray-800'
                        };
                        
                        return (
                          <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={statusColors[request.status]}>
                                    {getTranslation(language, request.status)}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {new Date(request.created_date).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm line-clamp-2">{request.ad_text}</p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {request.publication_time 
                                      ? new Date(request.publication_time).toLocaleString() 
                                      : getTranslation(language, "noSpecificTime")
                                    }
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <div className="text-lg font-bold">₪{request.price?.toFixed(2)}</div>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          {/* User Activity Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{getTranslation(language, "userActivity")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-md p-3 text-center">
                  <div className="text-lg font-bold text-blue-700">
                    {user.application_role === "advertiser" ? adRequests.length : (user.application_role === "channel_owner" ? channels.length : 0)}
                  </div>
                  <div className="text-xs text-blue-600">
                    {user.application_role === "advertiser"
                      ? getTranslation(language, "adRequests")
                      : (user.application_role === "channel_owner"
                          ? getTranslation(language, "channels")
                          : getTranslation(language, "actions")
                        )
                    }
                  </div>
                </div>
                <div className="bg-green-50 rounded-md p-3 text-center">
                  <div className="text-lg font-bold text-green-700">
                    {adRequests.filter(req => req.status === "completed").length}
                  </div>
                  <div className="text-xs text-green-600">
                    {getTranslation(language, "completedRequests")}
                  </div>
                </div>
                {user.application_role === "advertiser" && (
                  <div className="bg-purple-50 rounded-md p-3 text-center col-span-2">
                    <div className="text-lg font-bold text-purple-700">
                      ₪{adRequests
                        .filter(req => req.status === "completed")
                        .reduce((total, req) => total + (req.price || 0), 0)
                        .toFixed(2)}
                    </div>
                    <div className="text-xs text-purple-600">
                      {getTranslation(language, "totalSpent")}
                    </div>
                  </div>
                )}
                {user.application_role === "channel_owner" && (
                  <div className="bg-purple-50 rounded-md p-3 text-center col-span-2">
                    <div className="text-lg font-bold text-purple-700">
                      ₪{adRequests
                        .filter(req => req.status === "completed")
                        .reduce((total, req) => total + (req.price || 0), 0)
                        .toFixed(2)}
                    </div>
                    <div className="text-xs text-purple-600">
                      {getTranslation(language, "totalEarnings")}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>{getTranslation(language, "actions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.role !== "admin" && (
                <Button
                  variant={user.is_blocked ? "default" : "destructive"}
                  onClick={() => setConfirmDialogOpen(true)}
                  className={`w-full ${user.is_blocked ? "bg-green-600 hover:bg-green-700" : ""}`}
                >
                  {user.is_blocked ? (
                    <><Check className="mr-2 h-4 w-4" />{getTranslation(language, "unblockUser")}</>
                  ) : (
                    <><X className="mr-2 h-4 w-4" />{getTranslation(language, "blockUser")}</>
                  )}
                </Button>
              )}
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(createPageUrl("AdminDashboard"))}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {getTranslation(language, "backToDashboard")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {getTranslation(language, user.is_blocked ? "confirmUnblock" : "confirmBlock")}
            </DialogTitle>
            <DialogDescription>
              {getTranslation(language, user.is_blocked ? "unblockUserConfirmation" : "blockUserConfirmation")}
              {" "}
              <strong>{user.username || user.full_name}</strong>?
              
              {!user.is_blocked && (
                <p className="mt-2 text-red-500">
                  {getTranslation(language, "blockUserWarning")}
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={updating}>
              {getTranslation(language, "cancel")}
            </Button>
            <Button 
              variant={user.is_blocked ? "default" : "destructive"}
              onClick={handleToggleBlock} 
              disabled={updating}
              className={user.is_blocked ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {updating ? getTranslation(language, "processing") : getTranslation(language, user.is_blocked ? "unblock" : "block")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
