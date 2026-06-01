
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { TelegramChannel } from "@/api/entities";
import { getTranslation } from "@/components/translation/translations";
import { createPageUrl } from "@/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Check, X, Eye, ExternalLink, MessageSquare } from "lucide-react"; // Added MessageSquare
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminChannels() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending"); // Default to pending
  const [error, setError] = useState("");
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' or 'reject'

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("status");
    if (tabParam && ["pending", "approved", "rejected"].includes(tabParam)) {
      setStatusFilter(tabParam);
    }
  }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const userData = await User.me();
        if (userData.role !== "admin") {
          navigate(createPageUrl("Home"));
          return;
        }
        if (userData.language_preference) {
          setLanguage(userData.language_preference);
        }
        
        const allChannels = await TelegramChannel.getAll();
        setChannels(allChannels);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(getTranslation(language, "errorLoadingChannels"));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate, language]);

  useEffect(() => {
    let results = channels;
    if (statusFilter !== "all") {
      const isApproved = statusFilter === "approved";
      const isRejected = statusFilter === "rejected";
      if (statusFilter === "pending") {
         results = results.filter(channel => !channel.is_approved && !channel.is_rejected); // Assuming a new 'is_rejected' field or logic
      } else if (statusFilter === "approved"){
         results = results.filter(channel => channel.is_approved);
      } else if (statusFilter === "rejected") {
         results = results.filter(channel => channel.is_rejected); // Assuming is_rejected field exists
      }
    }
    setFilteredChannels(results);
  }, [channels, statusFilter]);

  const openConfirmationDialog = (channel, action) => {
    setSelectedChannel(channel);
    setConfirmAction(action);
    setIsConfirmDialogOpen(true);
  };

  const handleChannelAction = async () => {
    if (!selectedChannel || !confirmAction) return;
    setLoading(true); // Indicate processing
    setError("");
    try {
      const updateData = { 
        is_approved: confirmAction === "approve",
        is_rejected: confirmAction === "reject" // Assuming you add an 'is_rejected' field
      };
      await TelegramChannel.update(selectedChannel.id, updateData);
      
      // Refresh channels list
      const updatedChannels = await TelegramChannel.getAll();
      setChannels(updatedChannels);
    } catch (err) {
      console.error(`Error ${confirmAction}ing channel:`, err);
      setError(getTranslation(language, "errorUpdatingChannelStatus"));
    } finally {
      setLoading(false);
      setIsConfirmDialogOpen(false);
      setSelectedChannel(null);
      setConfirmAction(null);
    }
  };
  
  const statusBadgeColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
  };

  const getChannelStatus = (channel) => {
    if (channel.is_approved) return "approved";
    if (channel.is_rejected) return "rejected"; // Check for rejected status
    return "pending";
  };


  if (loading && channels.length === 0) { // Show loading only on initial load
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500">{getTranslation(language, "loadingChannels")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold">
        {getTranslation(language, "manageChannels")}
      </h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{getTranslation(language, "channelsList")}</CardTitle>
            <Tabs value={statusFilter} onValueChange={(value) => navigate(createPageUrl(`AdminChannels?status=${value}`))}>
              <TabsList>
                <TabsTrigger value="pending">{getTranslation(language, "pending")}</TabsTrigger>
                <TabsTrigger value="approved">{getTranslation(language, "approved")}</TabsTrigger>
                <TabsTrigger value="rejected">{getTranslation(language, "rejected")}</TabsTrigger>
                <TabsTrigger value="all">{getTranslation(language, "all")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <CardDescription>
            {getTranslation(language, `showing${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}Channels`)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredChannels.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                {getTranslation(language, "noChannelsFoundForFilter")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{getTranslation(language, "channelName")}</TableHead>
                  <TableHead>{getTranslation(language, "category")}</TableHead>
                  <TableHead>{getTranslation(language, "subscribers")}</TableHead>
                  <TableHead>{getTranslation(language, "postPrice")}</TableHead>
                  <TableHead>{getTranslation(language, "status")}</TableHead>
                  <TableHead className="text-right">{getTranslation(language, "actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChannels.map(channel => {
                  const currentStatus = getChannelStatus(channel);
                  return (
                    <TableRow key={channel.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 shrink-0">
                            {channel.avatar_url ? (
                              <img src={channel.avatar_url} alt={channel.name} className="w-full h-full object-cover"/>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-gray-500 font-bold">{channel.name?.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{channel.name}</div>
                            <div className="text-xs text-gray-500">@{channel.admin_username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTranslation(language, channel.category)}</TableCell>
                      <TableCell>{channel.subscribers_count?.toLocaleString()}</TableCell>
                      <TableCell>${channel.post_price?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${statusBadgeColors[currentStatus]} border`}>
                          {getTranslation(language, currentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => window.open(channel.telegram_link, "_blank")}
                            title={getTranslation(language, "viewOnTelegram")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        {currentStatus === "pending" && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500 hover:text-red-600"
                              onClick={() => openConfirmationDialog(channel, "reject")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-green-500 hover:text-green-600"
                              onClick={() => openConfirmationDialog(channel, "approve")}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {getTranslation(language, `confirm${confirmAction?.charAt(0).toUpperCase() + confirmAction?.slice(1)}`)}
            </DialogTitle>
            <DialogDescription>
              {getTranslation(language, `areYouSure${confirmAction?.charAt(0).toUpperCase() + confirmAction?.slice(1)}Channel`)} 
              <strong>{selectedChannel?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              {getTranslation(language, "cancel")}
            </Button>
            <Button 
              onClick={handleChannelAction} 
              className={confirmAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              disabled={loading}
            >
              {loading ? getTranslation(language, "processing") : getTranslation(language, confirmAction)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
