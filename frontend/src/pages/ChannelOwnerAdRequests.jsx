
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { AdRequest } from "@/api/entities";
import { TelegramChannel } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTranslation } from "@/components/translation/translations";
import { useLanguage } from "@/components/contexts/LanguageContext";
import { Eye, CheckCircle2, XCircle, Clock, Edit, Loader2 } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("all");
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        localStorage.removeItem("user");
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
  
  const renderRequestCard = (request) => {
    const isPendingOwner = (request.status === "pending" || request.status === "admin_approved") && !request.owner_approved;
    const isApproved = request.status === "approved";
    return (
      <Card key={request.id} className="overflow-hidden">
        {/* Card header — channel + badge */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-2">
          <p className="font-semibold text-sm truncate min-w-0">{getChannelName(request.channel_id)}</p>
          <Badge variant="outline" className={`${statusBadgeColors[request.status] || statusBadgeColors.canceled} border text-xs shrink-0`}>
            {getTranslation(language, request.status)}
          </Badge>
        </div>

        {/* Ad text */}
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-700 line-clamp-2">{request.ad_text}</p>
          <p className="text-xs text-gray-400 mt-1">
            ${request.price?.toFixed(2)} · {new Date(request.created_date).toLocaleDateString()}
          </p>
        </div>

        {/* Action buttons */}
        <div className="border-t px-3 py-2 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-gray-600"
            onClick={() => navigate(createPageUrl(`AdRequest?id=${request.id}`))}
          >
            <Eye className="h-4 w-4 mr-1" />{getTranslation(language, "details")}
          </Button>

          {isPendingOwner && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => openRejectModal(request)}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-1" />{getTranslation(language, "reject")}
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                onClick={() => handleUpdateRequestStatus(request.id, "approved")}
                disabled={isProcessing}
              >
                {isProcessing && selectedRequest?.id === request.id
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <><CheckCircle2 className="h-4 w-4 mr-1" />{getTranslation(language, "approve")}</>
                }
              </Button>
            </>
          )}

          {isApproved && (
            <Button
              size="sm"
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
              onClick={() => handleUpdateRequestStatus(request.id, "completed")}
              disabled={isProcessing}
            >
              {isProcessing && selectedRequest?.id === request.id
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><Edit className="h-4 w-4 mr-1" />{getTranslation(language, "markAsCompleted")}</>
              }
            </Button>
          )}
        </div>
      </Card>
    );
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const tabs = [
    { value: "all",              label: getTranslation(language, "all"),       count: adRequests.length },
    { value: "pending",          label: getTranslation(language, "pending"),   count: filteredRequests("pending").length },
    { value: "approved",         label: getTranslation(language, "approved"),  count: filteredRequests("approved").length },
    { value: "completed",        label: getTranslation(language, "completed"), count: filteredRequests("completed").length },
    { value: "rejected_canceled",label: getTranslation(language, "rejected"),  count: filteredRequests("rejected_canceled").length },
  ];

  return (
    <div className="space-y-4">
      {/* Horizontal scrollable tab bar */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${activeTab === tab.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                ${activeTab === tab.value ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Request list */}
      <div className="space-y-3">
        {(activeTab === "all" ? adRequests : filteredRequests(activeTab)).length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{getTranslation(language, "noPendingRequests")}</p>
          </div>
        ) : (
          (activeTab === "all" ? adRequests : filteredRequests(activeTab)).map(renderRequestCard)
        )}
      </div>
      
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getTranslation(language, "rejectRequest")}</DialogTitle>
            <DialogDescription>
              {getTranslation(language, "areYouSureRejectRequest")} "{selectedRequest?.ad_text?.substring(0,50)}..."?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
              <Label htmlFor="rejectionReason" className="sm:text-right sm:pt-2 col-span-1">
                {getTranslation(language, "reason")}
              </Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="col-span-1 sm:col-span-3"
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
