import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { TelegramChannel } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { getTranslation } from "@/components/translation/translations";
import { useLanguage } from "@/components/contexts/LanguageContext";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit3, Plus, Trash2, MessageSquare, Loader2, AlertCircle as RejectedIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MyChannels() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [user, setUser] = useState(null);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [channelToDelete, setChannelToDelete] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setPageError("");
      try {
        const userData = await User.me();
        setUser(userData);

        // Authorization check: User must be 'channel_owner' or 'admin'
        if (!(userData.application_role === "channel_owner" || userData.role === "admin")) {
          // If application_role exists but is not channel_owner (and user is not admin),
          // they shouldn't be here. Redirect to their appropriate dashboard or home.
          // If application_role is missing, redirect to CompleteProfile.
          if (userData.application_role) {
             navigate(createPageUrl("Home")); // Or their specific dashboard if defined
          } else {
             navigate(createPageUrl("CompleteProfile"));
          }
          return; // Stop further execution
        }
        
        // Fetch channels owned by this user
        const allChannels = await TelegramChannel.getAll();
const userChannels = allChannels.filter(ch => ch.owner_id === userData.id);
setChannels(userChannels);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.message.includes("User not authenticated") || error.status === 401) {
          navigate(createPageUrl("Login")); // Redirect to login if not authenticated
        } else {
          setPageError(getTranslation(language, "errorLoadingChannels"));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, language]);

  const handleDeleteChannel = async () => {
    if (!channelToDelete) return;
    setIsDeleting(true);
    try {
      await TelegramChannel.delete(channelToDelete.id);
      setChannels(prevChannels => prevChannels.filter(ch => ch.id !== channelToDelete.id));
      setDeleteDialogOpen(false);
      setChannelToDelete(null);
    } catch (error) {
      console.error("Error deleting channel:", error);
      setPageError(getTranslation(language, "errorDeletingChannel") + `: ${error.message}`);
      setDeleteDialogOpen(false); // Close dialog even on error
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (channel) => {
    setChannelToDelete(channel);
    setDeleteDialogOpen(true);
  };
  
  const statusBadgeColors = {
    approved: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    rejected: 'bg-red-100 text-red-800 border-red-200'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate(createPageUrl("ChannelOwnerDashboard"))}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          {getTranslation(language, "backToDashboard")}
        </Button>
        
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          {getTranslation(language, "myChannels")}
        </h1>
        
        <Button onClick={() => navigate(createPageUrl("AddChannel"))} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> {getTranslation(language, "addChannel")}
        </Button>
      </div>

      {pageError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
      )}

      {channels.length === 0 && !loading ? (
        <Card className="text-center py-12">
          <CardHeader>
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <CardTitle>{getTranslation(language, "noChannelsAddedYet")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>{getTranslation(language, "startAddingChannelsPrompt")}</CardDescription>
          </CardContent>
          <CardFooter className="justify-center">
            <Button onClick={() => navigate(createPageUrl("AddChannel"))}>
              <Plus className="mr-2 h-4 w-4" /> {getTranslation(language, "addYourFirstChannel")}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map(channel => {
            let status = "pending";
            let statusColorClass = statusBadgeColors.pending;
            if (channel.is_approved) {
              status = "approved";
              statusColorClass = statusBadgeColors.approved;
            } else if (channel.is_rejected) {
              status = "rejected";
              statusColorClass = statusBadgeColors.rejected;
            }
            
            return (
              <Card key={channel.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 relative">
                  {channel.avatar_url ? (
                    <img src={channel.avatar_url} alt={channel.name} className="max-h-full max-w-full object-contain rounded-md"/>
                  ) : (
                    <MessageSquare className="h-12 w-12 text-blue-300" />
                  )}
                  <Badge className={`absolute top-2 right-2 ${statusColorClass} border`}>
                    {getTranslation(language, status)}
                  </Badge>
                </div>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-lg truncate" title={channel.name}>{channel.name}</CardTitle>
                  <CardDescription className="text-xs text-gray-500">
                    {getTranslation(language, "subscribers")}: {channel.subscribers_count?.toLocaleString() || "N/A"} | {getTranslation(language, "price")}: ₪{channel.post_price?.toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {channel.description || getTranslation(language, "noDescriptionProvided")}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {getTranslation(language, "category")}: {getTranslation(language, channel.category)}
                  </p>
                  {channel.is_rejected && channel.rejection_reason && (
                    <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3 flex gap-2">
                      <RejectedIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-red-700 mb-0.5">
                          {getTranslation(language, "rejectionReason")}:
                        </p>
                        <p className="text-xs text-red-600">{channel.rejection_reason}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t p-3 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(createPageUrl(`AddChannel?edit=${channel.id}`))}
                    disabled={channel.is_approved}
                    title={channel.is_approved ? getTranslation(language, 'cannotEditApprovedRejected') : getTranslation(language, 'edit')}
                  >
                    <Edit3 className="mr-1 h-4 w-4" /> {getTranslation(language, "edit")}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => openDeleteDialog(channel)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> {getTranslation(language, "delete")}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getTranslation(language, "confirmDeleteChannel")}</DialogTitle>
            <DialogDescription>
              {getTranslation(language, "areYouSureDeleteChannel")} <strong>{channelToDelete?.name}</strong>? {getTranslation(language, "thisActionCannotBeUndone")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              {getTranslation(language, "cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteChannel} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {getTranslation(language, "delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}