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
import { 
  AlertCircle, 
  ArrowLeft, 
  ExternalLink, 
  MessageSquare, 
  User as UserIcon, 
  Mail, 
  Calendar, 
  DollarSign, 
  Users, 
  Check, 
  X, 
  Tag,
  Clock,
  Link2
} from "lucide-react";

export default function AdminChannelDetail() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState(null);
  const [owner, setOwner] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState("");
  const [rejectDialog, setRejectDialog] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Verify user is admin
        const userData = await User.me();
        if (userData.role !== "admin") {
          navigate(createPageUrl("Home"));
          return;
        }
        
        // Get channel ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const channelId = urlParams.get("id");
        
        if (!channelId) {
          setError(getTranslation(language, "missingChannelId"));
          return;
        }
        
        // Fetch channel data
        const channelData = await TelegramChannel.getById(channelId);
        if (!channelData) {
          setError(getTranslation(language, "channelNotFound"));
          return;
        }
        
        setChannel(channelData);
        
        // Fetch owner data
        if (channelData.owner_id) {
          try {
            const allUsers = await User.list();
            const ownerData = allUsers.find(u => u.id === channelData.owner_id);
            setOwner(ownerData || { username: 'Unknown', email: 'N/A' });
          } catch (err) {
            console.error("Error fetching owner data:", err);
          }
        }
        
        // Fetch ad requests for this channel
        try {
          const allRequests = await AdRequest.list("-created_date");
          const channelRequests = allRequests.filter(req => req.channel_id === channelId);
          setRequests(channelRequests);
        } catch (err) {
          console.error("Error fetching channel requests:", err);
        }
        
      } catch (err) {
        console.error("Error loading channel details:", err);
        setError(getTranslation(language, "errorLoadingChannelData"));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate, language]);
  
  const handleApproval = async (approved, reason) => {
    if (!channel) return;

    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      if (approved) {
        await TelegramChannel.approve(channel.id);
      } else {
        await TelegramChannel.reject(channel.id, reason);
      }

      setChannel({
        ...channel,
        is_approved: approved,
        is_rejected: !approved
      });

      setSuccess(
        approved
          ? getTranslation(language, "channelApprovalSuccess")
          : getTranslation(language, "channelRejectionSuccess")
      );
    } catch (err) {
      console.error(`Error ${approved ? 'approving' : 'rejecting'} channel:`, err);
      setError(getTranslation(language, "errorUpdatingChannel"));
    } finally {
      setUpdating(false);
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
  
  if (error || !channel) {
    return (
      <div className="container mx-auto py-8 max-w-5xl">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || getTranslation(language, "channelNotFound")}</AlertDescription>
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

  const getStatusBadge = () => {
    if (channel.is_approved) {
      return <Badge className="bg-green-100 text-green-800">{getTranslation(language, "approved")}</Badge>;
    } else if (channel.is_rejected) {
      return <Badge className="bg-red-100 text-red-800">{getTranslation(language, "rejected")}</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">{getTranslation(language, "pending")}</Badge>;
    }
  };
  
  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          {getTranslation(language, "backToDashboard")}
        </Button>

        {getStatusBadge()}
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
            {channel.name}
          </h1>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="details">{getTranslation(language, "channelDetails")}</TabsTrigger>
              <TabsTrigger value="requests">{getTranslation(language, "adRequests")}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>{getTranslation(language, "channelDetails")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 pb-4 border-b">
                    <div className="md:w-1/3">
                      <div className="h-48 aspect-square rounded-md overflow-hidden bg-gray-100">
                        {channel.avatar_url ? (
                          <img 
                            src={channel.avatar_url} 
                            alt={channel.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-100">
                            <MessageSquare className="h-16 w-16 text-blue-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-xl font-semibold">{channel.name}</h3>
                        <p className="text-gray-500">@{channel.admin_username}</p>
                      </div>
                      
                      <div className="flex items-center flex-wrap gap-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          {getTranslation(language, channel.category)}
                        </Badge>
                        <Badge variant="outline">
                          <Users className="mr-1 h-3 w-3" />
                          {channel.subscribers_count?.toLocaleString() || "N/A"} {getTranslation(language, "subscribers")}
                        </Badge>
                        <Badge variant="outline" className="flex items-center">
                          <DollarSign className="mr-1 h-3 w-3" />
                          ₪{channel.post_price?.toFixed(2)}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600">
                        {channel.description || getTranslation(language, "noDescription")}
                      </p>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => window.open(channel.telegram_link, "_blank")}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {getTranslation(language, "viewOnTelegram")}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Channel Information */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">
                        {getTranslation(language, "channelInformation")}
                      </h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-gray-400" />
                          <div className="text-sm">
                            <div className="text-gray-500">{getTranslation(language, "category")}</div>
                            <div className="font-medium">{getTranslation(language, channel.category)}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-gray-400" />
                          <div className="text-sm">
                            <div className="text-gray-500">{getTranslation(language, "telegramLink")}</div>
                            <div className="font-medium">
                              <a href={channel.telegram_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                {channel.telegram_link.replace('https://', '')}
                              </a>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                          <div className="text-sm">
                            <div className="text-gray-500">{getTranslation(language, "adminUsername")}</div>
                            <div className="font-medium">@{channel.admin_username}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <div className="text-sm">
                            <div className="text-gray-500">{getTranslation(language, "adminContactEmail")}</div>
                            <div className="font-medium">{channel.admin_contact_email || "N/A"}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div className="text-sm">
                            <div className="text-gray-500">{getTranslation(language, "added")}</div>
                            <div className="font-medium">
                              {new Date(channel.created_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Owner Information */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">
                        {getTranslation(language, "ownerInformation")}
                      </h3>
                      
                      {owner ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                              {owner.profile_image ? (
                                <img src={owner.profile_image} alt={owner.username || owner.full_name} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <UserIcon className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{owner.username || owner.full_name}</div>
                              <div className="text-sm text-gray-500">{getTranslation(language, owner.application_role ? `${owner.application_role}Role` : "userRole")}</div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <div className="text-sm">
                                <div className="text-gray-500">{getTranslation(language, "email")}</div>
                                <div className="font-medium">{owner.email}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <div className="text-sm">
                                <div className="text-gray-500">{getTranslation(language, "memberSince")}</div>
                                <div className="font-medium">
                                  {owner.created_date 
                                    ? new Date(owner.created_date).toLocaleDateString() 
                                    : getTranslation(language, "notAvailable")}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <Button 
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => navigate(createPageUrl(`AdminUserDetail?id=${owner.id}`))}
                          >
                            {getTranslation(language, "viewUserProfile")}
                          </Button>
                        </div>
                      ) : (
                        <div className="py-4 text-center text-gray-500">
                          {getTranslation(language, "ownerInfoNotAvailable")}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <CardTitle>{getTranslation(language, "channelAdRequests")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {requests.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">{getTranslation(language, "noRequestsForChannel")}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {requests.map(request => {
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
                          <div key={request.id} className="border rounded-md p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={statusColors[request.status]}>
                                    {getTranslation(language, request.status)}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {new Date(request.created_date).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm line-clamp-2">{request.ad_text}</p>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">₪{request.price?.toFixed(2)}</div>
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
          {/* Quick Stats Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{getTranslation(language, "quick")} {getTranslation(language, "statistics")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-md p-3 text-center">
                  <div className="text-lg font-bold text-blue-700">
                    {channel.subscribers_count?.toLocaleString() || "0"}
                  </div>
                  <div className="text-xs text-blue-600">
                    {getTranslation(language, "subscribers")}
                  </div>
                </div>
                <div className="bg-green-50 rounded-md p-3 text-center">
                  <div className="text-lg font-bold text-green-700">
                    ₪{channel.post_price?.toFixed(2) || "0.00"}
                  </div>
                  <div className="text-xs text-green-600">
                    {getTranslation(language, "postPrice")}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-md p-3 text-center">
                  <div className="text-lg font-bold text-purple-700">
                    {requests.filter(r => r.status === "completed").length}
                  </div>
                  <div className="text-xs text-purple-600">
                    {getTranslation(language, "completedAds")}
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-md p-3 text-center">
                  <div className="text-lg font-bold text-yellow-700">
                    {requests.filter(r => 
                      r.status === "pending" || 
                      r.status === "admin_approved" || 
                      r.status === "owner_approved" || 
                      r.status === "approved"
                    ).length}
                  </div>
                  <div className="text-xs text-yellow-600">
                    {getTranslation(language, "pendingAds")}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-1">
                  {getTranslation(language, "valuePerSubscriber")}
                </div>
                <div className="bg-gray-50 p-2 rounded-md text-center">
                  {channel.subscribers_count > 0 && channel.post_price ? (
                    <div>
                      <div className="font-bold text-lg">
                        ₪{((channel.post_price / channel.subscribers_count) * 1000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {getTranslation(language, "per1000Subscribers")}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      {getTranslation(language, "notAvailable")}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>{getTranslation(language, "actions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!channel.is_approved && !channel.is_rejected ? (
                <>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproval(true)}
                    disabled={updating}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {getTranslation(language, "approveChannel")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => setRejectDialog({ reason: "" })}
                    disabled={updating}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {getTranslation(language, "rejectChannel")}
                  </Button>
                </>
              ) : (
                channel.is_approved ? (
                  <Button
                    variant="outline"
                    className="w-full text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => setRejectDialog({ reason: "" })}
                    disabled={updating}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {getTranslation(language, "revokeApproval")}
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproval(true)}
                    disabled={updating}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {getTranslation(language, "approveChannel")}
                  </Button>
                )
              )}
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(channel.telegram_link, "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {getTranslation(language, "viewOnTelegram")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

      {/* Reject reason dialog */}
      {rejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">{getTranslation(language, "rejectChannel")}</h3>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{getTranslation(language, "rejectionReason")}</label>
              <div className="flex flex-wrap gap-2">
                {[
                  getTranslation(language, "rejectReasonProhibited"),
                  getTranslation(language, "rejectReasonSpam"),
                  getTranslation(language, "rejectReasonMisleading"),
                  getTranslation(language, "rejectReasonInappropriate"),
                ].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectDialog(d => ({ ...d, reason: preset }))}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      rejectDialog.reason === preset
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-white text-gray-600 border-gray-300 hover:border-red-300 hover:text-red-600"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none mt-2"
                rows={3}
                placeholder={getTranslation(language, "rejectionReasonPlaceholder")}
                value={rejectDialog.reason}
                onChange={e => setRejectDialog(d => ({ ...d, reason: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setRejectDialog(null)}>{getTranslation(language, "cancel")}</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" disabled={updating} onClick={() => { handleApproval(false, rejectDialog.reason); setRejectDialog(null); }}>
                <X className="h-4 w-4 mr-1" />{getTranslation(language, "reject")}
              </Button>
            </div>
          </div>
        </div>
      )}
  );
}