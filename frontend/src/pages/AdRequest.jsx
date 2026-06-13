
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, AdRequest, TelegramChannel, BACKEND_URL } from "@/api/entities";
import { getTranslation } from "@/components/translation/translations";
import { useLanguage } from "@/components/contexts/LanguageContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft, Check, X, ExternalLink, CheckCircle, Calendar, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";

export default function AdRequestPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [channel, setChannel] = useState(null);
  const [advertiser, setAdvertiser] = useState(null);
  const [ownerNotes, setOwnerNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updating, setUpdating] = useState(false);
  const [isChannelOwner, setIsChannelOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mediaLoadError, setMediaLoadError] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(null); // { mode: "admin"|"owner", reason: "" }
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const userData = await User.me();
        
        // Get request ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const requestId = urlParams.get("id");
        
        if (!requestId) {
          setError(getTranslation(language, "missingRequestId"));
          setLoading(false);
          return;
        }
        
        // Fetch request data
        const requestData = await AdRequest.get(requestId);
        if (!requestData) {
          setError(getTranslation(language, "requestNotFound"));
          setLoading(false);
          return;
        }
        
        setRequest(requestData);
        setOwnerNotes(requestData.owner_notes || "");
        
        // Fetch channel data
        if (requestData.channel_id) {
          const channelData = await TelegramChannel.get(requestData.channel_id);
          setChannel(channelData);
          
          // Check if current user is the channel owner
          setIsChannelOwner(channelData.owner_id === userData.id);
        }
        
        // Check if user is admin
        setIsAdmin(userData.role === "admin");
        
        // Fetch advertiser data
        if (requestData.advertiser_id) {
          try {
            const advertiserData = await User.getById(requestData.advertiser_id);
            setAdvertiser(advertiserData);
          } catch (error) {
            console.error("Error fetching advertiser:", error);
          }
        }
        
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(getTranslation(language, "errorLoadingRequest"));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate, language]);
  
  const handleUpdateStatus = async (status) => {
    setError("");
    setSuccess("");
    setUpdating(true);
    
    try {
      const updateData = { 
        status, 
        owner_notes: ownerNotes 
      };
      
      // Add appropriate approval flags
      if (status === "approved") {
        updateData.owner_approved = true;
      }
      
      await AdRequest.update(request.id, updateData);
      
      // Update local state
      setRequest({
        ...request,
        ...updateData
      });
      
      setSuccess(getTranslation(language, "requestStatusUpdated"));
      
      // After a delay, navigate back
      setTimeout(() => {
        navigate(createPageUrl("ChannelOwnerDashboard?tab=requests"));
      }, 2000);
      
    } catch (error) {
      console.error("Error updating request:", error);
      setError(getTranslation(language, "errorUpdatingRequest"));
    } finally {
      setUpdating(false);
    }
  };

  const handleAdminApproveSuspicious = async () => {
    setUpdating(true);
    try {
      await AdRequest.update(request.id, {
        status: "admin_approved", // This status means admin has approved, now pending owner
        admin_approved: true,
      });
      setSuccess(getTranslation(language, "adminApprovalSuccess"));
      // Refetch data to show updated status
      // ... (fetchData logic can be called here or rely on navigation back)
      const updatedRequest = await AdRequest.get(request.id); // Example: refetch
      setRequest(updatedRequest);
    } catch (err) {
      setError(getTranslation(language, "errorUpdatingRequest"));
    } finally {
      setUpdating(false);
    }
  };

  const handleAdminApproveRegular = async () => {
    setUpdating(true);
    try {
      const updateData = { admin_approved: true };
      if (request.owner_approved) {
        updateData.status = "approved";
      } else {
        updateData.status = "admin_approved";
      }
      await AdRequest.update(request.id, updateData);
      setSuccess(getTranslation(language, "adminApprovalSuccess"));
      const updatedRequest = await AdRequest.get(request.id);
      setRequest(updatedRequest);
    } catch (err) {
      setError(getTranslation(language, "errorUpdatingRequest"));
    } finally {
      setUpdating(false);
    }
  };
  
  const handleAdminReject = () => setRejectDialog({ mode: "admin", reason: "" });

  const handleOwnerReject = () => setRejectDialog({ mode: "owner", reason: "" });

  const submitReject = async () => {
    const reason = rejectDialog.reason || getTranslation(language, "notSuitableContent");
    setRejectDialog(null);
    setUpdating(true);
    try {
      if (rejectDialog.mode === "admin") {
        const updatePayload = {
          status: "rejected",
          rejection_reason: reason,
          rejected_by: (await User.me()).id,
          admin_approved: false,
        };
        if (request.status === "pending_admin_review" && request.is_suspicious) {
          updatePayload.is_suspicious = false;
        }
        await AdRequest.update(request.id, updatePayload);
        setSuccess(getTranslation(language, "adminRejectionSuccess"));
      } else {
        await AdRequest.update(request.id, {
          status: "rejected",
          rejection_reason: reason,
          rejected_by: (await User.me()).id,
          owner_approved: false,
          owner_notes: ownerNotes,
        });
        setSuccess(getTranslation(language, "requestStatusUpdated"));
      }
      const updatedRequest = await AdRequest.get(request.id);
      setRequest(updatedRequest);
    } catch (err) {
      setError(getTranslation(language, "errorUpdatingRequest"));
    } finally {
      setUpdating(false);
    }
  };

  const handleOwnerApprove = async () => {
    setUpdating(true);
    try {
      const updateData = { owner_approved: true, owner_notes: ownerNotes };
      if (request.admin_approved) {
        updateData.status = "approved";
      } else {
        updateData.status = "owner_approved";
      }
      await AdRequest.update(request.id, updateData);
      setSuccess(getTranslation(language, "requestStatusUpdated"));
      const updatedRequest = await AdRequest.get(request.id);
      setRequest(updatedRequest);
    } catch (err) {
      setError(getTranslation(language, "errorUpdatingRequest"));
    } finally {
      setUpdating(false);
    }
  };

  
  const handleOwnerMarkCompleted = async () => {
    setUpdating(true);
    try {
      await AdRequest.update(request.id, {
        status: "completed",
        is_posted: true,
        posted_at: new Date().toISOString()
      });
      setSuccess(getTranslation(language, "requestMarkedCompleted"));
      const updatedRequest = await AdRequest.get(request.id);
      setRequest(updatedRequest);
    } catch (err) {
      setError(getTranslation(language, "errorUpdatingRequest"));
    } finally {
      setUpdating(false);
    }
  };
  
  const statusBadgeColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    admin_approved: 'bg-blue-100 text-blue-800 border-blue-200',
    owner_approved: 'bg-purple-100 text-purple-800 border-purple-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    canceled: 'bg-gray-100 text-gray-800 border-gray-200'
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
  
  // Show error if request not found
  if (!request || error) {
    return (
      <div className="container mx-auto max-w-3xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || getTranslation(language, "requestNotFound")}</AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          className="mt-4 flex items-center gap-1"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          {getTranslation(language, "goBack")}
        </Button>
      </div>
    );
  }
  
  // Format publication time for display
  const formattedPublicationTime = request.publication_time ?
    format(new Date(request.publication_time), 'PPpp') :
    getTranslation(language, "noSpecificTime");

  const resolveMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
  };
  const mediaUrl = resolveMediaUrl(request.media_url);
  
  // Main content when request is found
  return (
    <>
    <div className="container mx-auto max-w-3xl py-8">
      <Button 
        variant="outline" 
        className="mb-6 flex items-center gap-1"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        {getTranslation(language, "back")}
      </Button>
      
      {success && (
        <Alert className="mb-6 bg-green-50 text-green-800 border border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <Card className="shadow-lg">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <CardTitle className="text-xl">
                {getTranslation(language, "adRequestDetails")}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={`${statusBadgeColors[request.status]} border`}>
                  {getTranslation(language, request.status)}
                </Badge>
                <span className="text-sm text-gray-500">
                  {getTranslation(language, "submitted")} {format(new Date(request.created_date), 'PPP')}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xl font-bold">₪{request.price?.toFixed(2)}</div>
              <div className="text-sm text-gray-500">
                {getTranslation(language, "adRequestPrice")}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          {/* Channel info */}
          {channel && (
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-blue-100 shrink-0">
                {channel.avatar_url ? (
                  <img src={channel.avatar_url} alt={channel.name} className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">{channel.name?.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{channel.name}</h3>
                <p className="text-sm text-gray-500">{channel.description}</p>
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => window.open(channel.telegram_link, "_blank")}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {getTranslation(language, "viewChannel")}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Publication time */}
          <div>
            <h3 className="font-semibold mb-2">
              {getTranslation(language, "requestedPublicationTime")}
            </h3>
            <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-3 rounded-md">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>{formattedPublicationTime}</span>
            </div>
          </div>
          
          {/* Ad content */}
          <div>
            <h3 className="font-semibold mb-2">{getTranslation(language, "adText")}</h3>
            <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
              {request.ad_text}
            </div>
          </div>
          
          {/* Media if available */}
          {mediaUrl && (
            <div>
              <h3 className="font-semibold mb-2">{getTranslation(language, "adMedia")}</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                {(mediaUrl.includes("/video/upload/") || mediaUrl.match(/\.(mp4|webm)$/i)) ? (
                  <video
                    controls
                    className="max-w-full h-auto rounded-md max-h-80 mx-auto"
                  >
                    <source src={mediaUrl} />
                    {getTranslation(language, "videoNotSupported")}
                  </video>
                ) : mediaLoadError ? (
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => window.open(mediaUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {getTranslation(language, "viewMediaFile")}
                  </Button>
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Advertisement Media"
                    className="max-w-full h-auto rounded-md max-h-80 mx-auto"
                    onError={() => setMediaLoadError(true)}
                  />
                )}
              </div>
            </div>
          )}
          
          {/* Owner notes section - only shown to channel owner and admin */}
          {(isChannelOwner || isAdmin) && (
            <div>
              <Label htmlFor="owner_notes">
                {getTranslation(language, "ownerNotes")} ({getTranslation(language, "optional")})
              </Label>
              <Textarea
                id="owner_notes"
                placeholder={getTranslation(language, "notesPlaceholder")}
                className="mt-2"
                rows={4}
                value={ownerNotes}
                onChange={(e) => setOwnerNotes(e.target.value)}
                disabled={!isChannelOwner || request.status !== "pending" && request.status !== "admin_approved"}
              />
              <p className="text-xs text-gray-500 mt-1">
                {getTranslation(language, "ownerNotesHelp")}
              </p>
            </div>
          )}
          
          {/* Advertiser info */}
          {advertiser && (
            <div>
              <h3 className="font-semibold mb-2">{getTranslation(language, "advertiserInfo")}</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm">
                  <span className="font-medium">{getTranslation(language, "username")}: </span>
                  {advertiser.username || advertiser.full_name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">{getTranslation(language, "email")}: </span>
                  {advertiser.email}
                </p>
              </div>
            </div>
          )}
          
          {/* Status info */}
          <div>
            <h3 className="font-semibold mb-2">{getTranslation(language, "approvalStatus")}</h3>
            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={request.admin_approved ? "success" : "outline"} className={request.admin_approved ? "bg-green-100 text-green-800" : ""}>
                  {request.admin_approved ? (
                    <><Check className="h-3 w-3 mr-1" /> {getTranslation(language, "adminApproved")}</>
                  ) : (
                    getTranslation(language, "waitingForAdmin")
                  )}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={request.owner_approved ? "success" : "outline"} className={request.owner_approved ? "bg-green-100 text-green-800" : ""}>
                  {request.owner_approved ? (
                    <><Check className="h-3 w-3 mr-1" /> {getTranslation(language, "ownerApproved")}</>
                  ) : (
                    getTranslation(language, "waitingForOwner")
                  )}
                </Badge>
              </div>
              {request.status === "approved" && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    {getTranslation(language, "fullyApproved")}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        {/* Inside CardFooter, conditionally render buttons: */}
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
          {isAdmin && request.status === "pending_admin_review" && (
            <>
              <Button variant="destructive" onClick={handleAdminReject} disabled={updating}>
                <X className="mr-2 h-4 w-4" /> {getTranslation(language, "rejectProhibitedContent")}
              </Button>
              <Button onClick={handleAdminApproveSuspicious} disabled={updating} className="bg-green-600 hover:bg-green-700">
                <Check className="mr-2 h-4 w-4" /> {getTranslation(language, "markSafeAndForward")}
              </Button>
            </>
          )}

          {isAdmin && (request.status === "pending" || request.status === "owner_approved") && !request.admin_approved && (
            <>
              <Button variant="destructive" onClick={handleAdminReject} disabled={updating}>
                 <X className="mr-2 h-4 w-4" /> {getTranslation(language, "rejectRequest")}
              </Button>
              <Button onClick={handleAdminApproveRegular} disabled={updating} className="bg-green-600 hover:bg-green-700">
                <Check className="mr-2 h-4 w-4" /> {getTranslation(language, "adminApprove")}
              </Button>
            </>
          )}

          {isChannelOwner && (request.status === "pending" || request.status === "admin_approved") && !request.owner_approved && (
            <>
              <Button variant="destructive" onClick={handleOwnerReject} disabled={updating}>
                <X className="mr-2 h-4 w-4" /> {getTranslation(language, "rejectRequest")}
              </Button>
              <Button onClick={handleOwnerApprove} disabled={updating} className="bg-green-600 hover:bg-green-700">
                <Check className="mr-2 h-4 w-4" /> {getTranslation(language, "approveRequest")}
              </Button>
            </>
          )}
          
          {isChannelOwner && request.status === "approved" && !request.is_posted && (
             <Button onClick={handleOwnerMarkCompleted} disabled={updating} className="bg-purple-600 hover:bg-purple-700">
               <CheckCircle className="mr-2 h-4 w-4" /> {getTranslation(language, "markAsCompleted")}
             </Button>
          )}
        </CardFooter>
      </Card>
    </div>

    {/* Reject reason dialog */}
    {rejectDialog && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">{getTranslation(language, "rejectRequest")}</h3>
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
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={submitReject}>
              <X className="h-4 w-4 mr-1" />{getTranslation(language, "reject")}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
