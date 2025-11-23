
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { AdRequest } from "@/api/entities";
import { TelegramChannel } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getTranslation } from "@/components/translation/translations";
import { useLanguage } from "@/components/contexts/LanguageContext";
import { ArrowLeft, Eye, CheckCircle2, XCircle, Clock, Edit, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";


export default function ChannelOwnerAdRequests() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adRequests, setAdRequests] = useState([]);
  const [channels, setChannels] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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

        const channelsData = await TelegramChannel.filter({ owner_id: userData.id });
        setChannels(channelsData);
        const channelIds = channelsData.map(ch => ch.id);

        if (channelIds.length > 0) {
          const allRequests = await AdRequest.filter({ channel_id__in: channelIds }, "-created_date");
          // Filter out requests that are pending_admin_review (suspicious ones not yet cleared by admin)
          const displayableRequests = allRequests.filter(req => req.status !== "pending_admin_review");
          setAdRequests(displayableRequests);
        }
      } catch (error) {
        console.error("Error fetching ad requests:", error);
        if (error.message.includes("User not authenticated") || error.status === 401) {
          navigate(createPageUrl("Login"));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleUpdateRequestStatus = async (requestId, newStatus, reason = null) => {
    setIsProcessing(true);
    try {
      const updateData = { status: newStatus };
      if (newStatus === "rejected" && reason) {
        updateData.rejection_reason = reason;
        updateData.rejected_by = user.id;
        updateData.owner_approved = false; // Explicitly set if rejecting
      } else if (newStatus === "approved") { // This is when owner approves from their side
        const request = adRequests.find(r => r.id === requestId);
        updateData.owner_approved = true;
        if (request.admin_approved) { // If admin also approved
          updateData.status = "approved"; // Final approval status
        } else { // If admin hasn't approved yet
          updateData.status = "owner_approved"; // Owner has approved, waiting for admin
        }
      } else if (newStatus === "completed") {
         updateData.is_posted = true;
         updateData.posted_at = new Date().toISOString();
      }

      await AdRequest.update(requestId, updateData);
      // Refresh adRequests list
      const channelIds = channels.map(ch => ch.id);
      if (channelIds.length > 0) {
          const allRequests = await AdRequest.filter({ channel_id__in: channelIds }, "-created_date");
          const displayableRequests = allRequests.filter(req => req.status !== "pending_admin_review");
          setAdRequests(displayableRequests);
      }
      if (isRejectModalOpen) setIsRejectModalOpen(false);
      setRejectionReason("");

    } catch (error) {
      console.error("Error updating request status:", error);
      // TODO: Show error toast/message to user
    } finally {
      setIsProcessing(false);
    }
  };
  
  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setIsRejectModalOpen(true);
  };

  const getChannelName = (channelId) => {
    const channel = channels.find(ch => ch.id === channelId);
    return channel ? channel.name : getTranslation(language, "unknownChannel");
  };

  const statusBadgeColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    admin_approved: 'bg-blue-100 text-blue-800 border-blue-200', // Admin approved, owner pending
    owner_approved: 'bg-sky-100 text-sky-800 border-sky-200', // Owner approved, admin pending
    approved: 'bg-green-100 text-green-800 border-green-200', // Both approved
    rejected: 'bg-red-100 text-red-800 border-red-200',
    completed: 'bg-purple-100 text-purple-800 border-purple-200',
    canceled: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const filteredRequests = (status) => {
    if (status === "pending") { // Owner's pending queue
      return adRequests.filter(req => (req.status === "pending" || req.status === "admin_approved") && !req.owner_approved);
    }
    if (status === "approved") { // Ads fully approved and ready to be (or already) posted
      return adRequests.filter(req => req.status === "approved");
    }
    if (status === "completed") {
      return adRequests.filter(req => req.status === "completed");
    }
    if (status === "rejected_canceled") {
        return adRequests.filter(req => req.status === "rejected" || req.status === "canceled");
    }
    return adRequests; // For "all" tab
  };
  
  const renderRequestCard = (request) => (
    <Card key={request.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <CardTitle className="text-md mb-1 sm:mb-0">{getChannelName(request.channel_id)}</CardTitle>
          <Badge variant="outline" className={`${statusBadgeColors[request.status] || statusBadgeColors.canceled} border text-xs`}>
            {getTranslation(language, request.status)}
            {request.status === 'pending' && request.admin_approved && ' (' + getTranslation(language, 'adminApproved') + ')'}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {getTranslation(language, "submitted")}: {new Date(request.created_date).toLocaleDateString()} | ${request.price?.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 mb-3 line-clamp-3">{request.ad_text}</p>
        {request.media_url && (
          <Button variant="outline" size="sm" onClick={() => window.open(request.media_url, "_blank")}>
            {getTranslation(language, "viewMedia")}
          </Button>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl(`AdRequest?id=${request.id}`))}>
          <Eye className="mr-1 h-4 w-4" />{getTranslation(language, "details")}
        </Button>
        {/* Actions for Pending/Admin Approved (awaiting owner) */}
        {((request.status === "pending" || request.status === "admin_approved") && !request.owner_approved) && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
              onClick={() => openRejectModal(request)}
              disabled={isProcessing}
            >
              <XCircle className="mr-1 h-4 w-4" />{getTranslation(language, "reject")}
            </Button>
            <Button 
              size="sm" 
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={() => handleUpdateRequestStatus(request.id, "approved")} // This will become 'owner_approved' or 'approved'
              disabled={isProcessing}
            >
               {isProcessing && selectedRequest?.id === request.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle2 className="mr-1 h-4 w-4" />}
              {getTranslation(language, "approve")}
            </Button>
          </>
        )}
        {/* Action for Approved (ready to be marked completed) */}
        {request.status === "approved" && (
          <Button 
            size="sm" 
            className="bg-purple-500 hover:bg-purple-600 text-white"
            onClick={() => handleUpdateRequestStatus(request.id, "completed")}
            disabled={isProcessing}
          >
            {isProcessing && selectedRequest?.id === request.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Edit className="mr-1 h-4 w-4" />}
            {getTranslation(language, "markAsCompleted")}
          </Button>
        )}
      </CardFooter>
    </Card>
  );


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={() => navigate(createPageUrl("ChannelOwnerDashboard"))} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {getTranslation(language, "backToDashboard")}
        </Button>
        <h1 className="text-2xl font-bold">{getTranslation(language, "adRequests")}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-6">
          <TabsTrigger value="pending">{getTranslation(language, "pending")} ({filteredRequests("pending").length})</TabsTrigger>
          <TabsTrigger value="approved">{getTranslation(language, "approved")} ({filteredRequests("approved").length})</TabsTrigger>
          <TabsTrigger value="completed">{getTranslation(language, "completed")} ({filteredRequests("completed").length})</TabsTrigger>
          <TabsTrigger value="rejected_canceled">{getTranslation(language, "rejected")}/{getTranslation(language, "canceled")} ({filteredRequests("rejected_canceled").length})</TabsTrigger>
          <TabsTrigger value="all">{getTranslation(language, "all")} ({adRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {filteredRequests("pending").length > 0 ? 
            filteredRequests("pending").map(renderRequestCard) : 
            <p className="text-gray-500 text-center py-4">{getTranslation(language, "noPendingRequests")}</p>}
        </TabsContent>
        <TabsContent value="approved">
          {filteredRequests("approved").length > 0 ? 
            filteredRequests("approved").map(renderRequestCard) : 
            <p className="text-gray-500 text-center py-4">{getTranslation(language, "noApprovedRequests")}</p>}
        </TabsContent>
        <TabsContent value="completed">
          {filteredRequests("completed").length > 0 ? 
            filteredRequests("completed").map(renderRequestCard) : 
            <p className="text-gray-500 text-center py-4">{getTranslation(language, "noCompletedRequests")}</p>}
        </TabsContent>
        <TabsContent value="rejected_canceled">
          {filteredRequests("rejected_canceled").length > 0 ? 
            filteredRequests("rejected_canceled").map(renderRequestCard) : 
            <p className="text-gray-500 text-center py-4">{getTranslation(language, "noRejectedCanceledRequests")}</p>}
        </TabsContent>
        <TabsContent value="all">
          {adRequests.length > 0 ? 
            adRequests.map(renderRequestCard) : 
            <p className="text-gray-500 text-center py-4">{getTranslation(language, "noRequestsYet")}</p>}
        </TabsContent>
      </Tabs>
      
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getTranslation(language, "rejectRequest")}</DialogTitle>
            <DialogDescription>
              {getTranslation(language, "areYouSureRejectRequest")} "{selectedRequest?.ad_text?.substring(0,50)}..."?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rejectionReason" className="text-right col-span-1">
                {getTranslation(language, "reason")}
              </Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="col-span-3"
                placeholder={getTranslation(language, "optionalReasonPlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)} disabled={isProcessing}>
              {getTranslation(language, "cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleUpdateRequestStatus(selectedRequest.id, "rejected", rejectionReason)}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {getTranslation(language, "reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
