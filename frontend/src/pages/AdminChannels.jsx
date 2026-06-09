
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { User } from "@/api/entities";
import { TelegramChannel } from "@/api/entities";
import { getTranslation } from "@/components/translation/translations";
import { useLanguage } from "@/components/contexts/LanguageContext";
import { createPageUrl } from "@/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Check, X, ExternalLink, MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") || "pending";

  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [error, setError] = useState("");
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedPresets, setSelectedPresets] = useState([]);
  const [rejectionNote, setRejectionNote] = useState("");

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
  }, [navigate]);

  const filteredChannels = (() => {
    if (statusFilter === "all") return channels;
    if (statusFilter === "approved") return channels.filter(c => c.is_approved);
    if (statusFilter === "rejected") return channels.filter(c => c.is_rejected);
    return channels.filter(c => !c.is_approved && !c.is_rejected); // pending
  })();

  const openConfirmationDialog = (channel, action) => {
    setSelectedChannel(channel);
    setConfirmAction(action);
    setSelectedPresets([]);
    setRejectionNote("");
    setIsConfirmDialogOpen(true);
  };

  const handleChannelAction = async () => {
    if (!selectedChannel || !confirmAction) return;
    setLoading(true);
    setError("");
    try {
      if (confirmAction === "approve") {
        await TelegramChannel.approve(selectedChannel.id);
      } else {
        const parts = [...selectedPresets];
        if (rejectionNote.trim()) parts.push(rejectionNote.trim());
        await TelegramChannel.reject(selectedChannel.id, parts.join(" | "));
      }
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
      setSelectedPresets([]);
      setRejectionNote("");
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <CardTitle>{getTranslation(language, "channelsList")}</CardTitle>
            <Tabs value={statusFilter} onValueChange={(value) => navigate(createPageUrl(`AdminChannels?status=${value}`))}>
              <TabsList className="grid grid-cols-4 w-full sm:w-auto">
                <TabsTrigger value="pending" className="text-xs sm:text-sm">{getTranslation(language, "pending")}</TabsTrigger>
                <TabsTrigger value="approved" className="text-xs sm:text-sm">{getTranslation(language, "approved")}</TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs sm:text-sm">{getTranslation(language, "rejected")}</TabsTrigger>
                <TabsTrigger value="all" className="text-xs sm:text-sm">{getTranslation(language, "all")}</TabsTrigger>
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
            <div className="overflow-x-auto">
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
                      <TableCell>₪{channel.post_price?.toFixed(2)}</TableCell>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve dialog */}
      <Dialog
        open={isConfirmDialogOpen && confirmAction === "approve"}
        onOpenChange={(open) => !open && setIsConfirmDialogOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "en" ? "Approve channel" : "Подтвердить канал"}</DialogTitle>
            <DialogDescription>
              {language === "en" ? "Approve" : "Одобрить"} <strong>{selectedChannel?.name}</strong>?{" "}
              {language === "en"
                ? "It will become visible to advertisers."
                : "Он станет виден рекламодателям."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              {getTranslation(language, "cancel")}
            </Button>
            <Button onClick={handleChannelAction} className="bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? getTranslation(language, "processing") : getTranslation(language, "approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog — with preset reasons + free text */}
      {(() => {
        const isHe = language === "he";
        const presets = isHe
          ? [
              "הערוץ אינו עומד בדרישות התוכן שלנו",
              "מספר מנויים לא מספיק",
              "ערוץ לא פעיל (אין פרסומים אחרונים)",
              "הערוץ מכיל תוכן אסור",
              "קישור לערוץ לא חוקי או לא נגיש",
            ]
          : [
              "Channel doesn't meet our content requirements",
              "Insufficient subscriber count",
              "Inactive channel (no recent posts)",
              "Channel contains prohibited content",
              "Invalid or inaccessible channel link",
            ];
        return (
          <Dialog
            open={isConfirmDialogOpen && confirmAction === "reject"}
            onOpenChange={(open) => !open && setIsConfirmDialogOpen(false)}
          >
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-red-600">
                  {isHe ? "דחיית ערוץ" : "Reject channel"}
                </DialogTitle>
                <DialogDescription>
                  {isHe ? "דחיית" : "Rejecting"}{" "}
                  <strong>{selectedChannel?.name}</strong>.{" "}
                  {isHe
                    ? "בחרו סיבה או כתבו משלכם — היא תוצג לבעל הערוץ."
                    : "Choose a reason or write your own — it will be shown to the channel owner."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Preset reasons — toggle on/off independently */}
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset) => {
                    const active = selectedPresets.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          setSelectedPresets(prev =>
                            active ? prev.filter(p => p !== preset) : [...prev, preset]
                          )
                        }
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${isHe ? "text-right" : "text-left"} ${
                          active
                            ? "bg-red-50 border-red-400 text-red-700 font-medium"
                            : "border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        {active && <span className="mr-1">✓</span>}
                        {preset}
                      </button>
                    );
                  })}
                </div>

                {/* Additional note — independent of presets */}
                <div>
                  <p className={`text-xs text-gray-500 mb-1 ${isHe ? "text-right" : ""}`}>
                    {isHe ? "הערה נוספת (אופציונלי)" : "Additional note (optional)"}
                  </p>
                  <Textarea
                    placeholder={isHe ? "…הוסיפו פרטים נוספים" : "Add more details…"}
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    rows={2}
                    className={`text-sm resize-none ${isHe ? "text-right" : ""}`}
                    dir={isHe ? "rtl" : "ltr"}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                  {getTranslation(language, "cancel")}
                </Button>
                <Button
                  onClick={handleChannelAction}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={loading}
                >
                  {loading
                    ? getTranslation(language, "processing")
                    : isHe ? "דחה" : "Reject"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
