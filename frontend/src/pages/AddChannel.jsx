import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, TelegramChannel } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { useLanguage } from "@/components/contexts/LanguageContext";
import { getTranslation } from "@/components/translation/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Loader2,
  UploadCloud,
  X as ClearIcon,
} from "lucide-react";

// Use ?? so an empty VITE_API_URL falls back to "" (Vercel proxy), not localhost
const API_BASE = import.meta.env.VITE_API_URL ?? "";

export default function AddChannel() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [pageLoading, setPageLoading] = useState(true);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const fileInputRef = useRef(null);

  const [channelData, setChannelData] = useState({
  name: "",
  description: "",
  telegram_link: "",
  avatar_url: "",
  subscribers_count: 0,
  category: "tech",
  post_price: "",
  admin_username: "",
  admin_contact_email: "",
  terms_accepted: false
});

  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    const initializePage = async () => {
      setPageLoading(true);
      try {
        const userData = await User.me();
        setCurrentUser(userData);

        if (!(userData.application_role === "channel_owner" || userData.role === "admin")) {
          if (userData.application_role) {
            navigate(createPageUrl("ChannelOwnerDashboard"));
          } else {
            navigate(createPageUrl("CompleteProfile"));
          }
          return;
        }

        if (userData.email) {
          setChannelData(prev => ({
            ...prev,
            admin_contact_email: userData.email,
            admin_username: userData.username || prev.admin_username
          }));
        }

      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate(createPageUrl("Login"));
      } finally {
        setPageLoading(false);
      }
    };

    initializePage();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setChannelData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setChannelData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFetchChannelInfo = async () => {
    setFetchLoading(true);
    setError("");

    const retryDelays = [0, 3000, 5000, 8000];
    let lastErr;
    for (const delay of retryDelays) {
      if (delay > 0) await new Promise(r => setTimeout(r, delay));
      try {
        const res = await fetch(`${API_BASE}/api/get_channel_info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ link: channelData.telegram_link }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Error fetching Telegram channel data.");
          setFetchLoading(false);
          return;
        }
        setChannelData(prev => ({
          ...prev,
          name: data.name,
          description: data.description,
          subscribers_count: data.subscribers_count,
          avatar_url: data.avatar_url || prev.avatar_url,
        }));
        setFetchLoading(false);
        return;
      } catch (err) {
        lastErr = err;
      }
    }
    console.error("Network error:", lastErr);
    setError("Network error: " + (lastErr?.message || "Load failed"));
    setFetchLoading(false);
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError(getTranslation(language, "invalidFileType") + " (JPEG, PNG, GIF, WebP)");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(getTranslation(language, "fileTooLarge") + " (Max 5MB)");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadingAvatar(true);
    setError("");

    try {
      const uploadResult = await UploadFile(file);
      if (uploadResult && uploadResult.file_url) {
        setChannelData(prev => ({ ...prev, avatar_url: uploadResult.file_url }));
        setAvatarPreview(URL.createObjectURL(file));
      } else {
        throw new Error("File upload failed to return a URL.");
      }
    } catch (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      setError(getTranslation(language, "errorUploadingAvatar") + (uploadError.message ? `: ${uploadError.message}` : ''));
      setAvatarPreview(null);
      setChannelData(prev => ({ ...prev, avatar_url: "" }));
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploadingAvatar(false);
    }
  };

  const clearAvatar = () => {
    setChannelData(prev => ({ ...prev, avatar_url: "" }));
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!channelData.name || !channelData.telegram_link || !channelData.category || !channelData.post_price || !channelData.admin_username || !channelData.admin_contact_email) {
      setError(getTranslation(language, "allFieldsRequired"));
      return;
    }

    if (!channelData.avatar_url && avatarPreview) {
      setError(getTranslation(language, "errorAvatarUploadIncomplete"));
      return;
    }

    const price = parseFloat(channelData.post_price);
    if (isNaN(price) || price <= 0) {
      setError(getTranslation(language, "priceMustBePositive"));
      return;
    }

    if (!channelData.terms_accepted) {
      setError(getTranslation(language, "mustAcceptTerms"));
      return;
    }

    setSubmitting(true);

    try {
      const user = await User.me();
      const newChannel = {
        name: channelData.name,
        description: channelData.description,
        telegram_link: channelData.telegram_link,
        avatar_url: channelData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(channelData.name || 'C')}&background=0D8ABC&color=fff&size=128&font-size=0.5&bold=true`,
        subscribers_count: parseInt(channelData.subscribers_count, 10) || 0,
        category: channelData.category,
        post_price: price,
        admin_username: channelData.admin_username,
        admin_contact_email: channelData.admin_contact_email,
        owner_id: user.id,
        is_approved: false,
        is_rejected: false,
      };

      await TelegramChannel.create(newChannel);
      setSuccess(true);

      setTimeout(() => {
        navigate(createPageUrl("MyChannels"));
      }, 2000);

    } catch (submitError) {
      console.error("Error submitting channel:", submitError);
      setError(getTranslation(language, "errorSubmittingChannel") + (submitError.message ? `: ${submitError.message}` : ''));
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const categories = ["tech", "business", "entertainment", "news", "lifestyle", "education", "crypto", "gaming", "travel", "finance", "health", "sports", "other"];


  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Button
        variant="outline"
        onClick={() => navigate(createPageUrl("ChannelOwnerDashboard"))}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {getTranslation(language, "backToDashboard")}
      </Button>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{getTranslation(language, "addTelegramChannel")}</CardTitle>
          <CardDescription>{getTranslation(language, "addChannelDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="default" className="mb-4 bg-green-50 border-green-200 text-green-700">
              <Check className="h-4 w-4" />
              <AlertDescription>{getTranslation(language, "channelSubmittedSuccess")}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="telegram_link">{getTranslation(language, "telegramChannelLink")}</Label>
              <div className="flex gap-2">
                <Input
                  id="telegram_link"
                  name="telegram_link"
                  value={channelData.telegram_link}
                  onChange={handleInputChange}
                  placeholder="e.g., https://t.me/yourchannel"
                  className="flex-grow"
                />
                <Button type="button" onClick={handleFetchChannelInfo} disabled={fetchLoading || !channelData.telegram_link}>
                  {fetchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : getTranslation(language, "fetchInfo")}
                </Button>
              </div>
              <p className="text-xs text-gray-500">{getTranslation(language, "fetchInfoHint")}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">{getTranslation(language, "channelName")}</Label>
                <Input id="name" name="name" value={channelData.name} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscribers_count">{getTranslation(language, "subscribersCount")}</Label>
                <Input id="subscribers_count" name="subscribers_count" type="number" value={channelData.subscribers_count} onChange={handleInputChange} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">{getTranslation(language, "channelDescription")}</Label>
              <Textarea id="description" name="description" value={channelData.description} onChange={handleInputChange} rows={3} />
              <p className="text-xs text-gray-500">{getTranslation(language, "verifyFetchedInfo")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_upload">{getTranslation(language, "channelAvatar")}</Label>
              <div className="flex items-center gap-4">
                {avatarPreview ? (
                  <div className="relative group">
                    <img 
                      src={avatarPreview} 
                      alt={getTranslation(language, "channelAvatarPreview")}
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 bg-black/30 hover:bg-black/50 text-white rounded-full h-6 w-6 group-hover:opacity-100 opacity-0 transition-opacity"
                      onClick={clearAvatar}
                      title={getTranslation(language, "clearAvatar")}
                    >
                      <ClearIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-24 h-24 flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
                    <UploadCloud className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-grow">
                   <Input
                    id="avatar_upload"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarUpload}
                    ref={fileInputRef}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    disabled={uploadingAvatar}
                  />
                  {uploadingAvatar && <Loader2 className="h-4 w-4 animate-spin mt-1" />}
                   <p className="text-xs text-gray-500 mt-1">{getTranslation(language, "avatarUploadHint") + " (Max 5MB, JPG/PNG/GIF/WebP)"}</p>
                </div>
              </div>
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">{getTranslation(language, "category")}</Label>
                <Select name="category" value={channelData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={getTranslation(language, "selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{getTranslation(language, cat)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="post_price">{getTranslation(language, "pricePerPost")} ($)</Label>
                <Input id="post_price" name="post_price" type="number" step="0.01" value={channelData.post_price} onChange={handleInputChange} required placeholder="e.g., 25.50"/>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="admin_username">{getTranslation(language, "telegramAdminUsername")}</Label>
                <Input id="admin_username" name="admin_username" value={channelData.admin_username} onChange={handleInputChange} placeholder="@your_tg_username" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin_contact_email">{getTranslation(language, "adminContactEmail")}</Label>
                <Input id="admin_contact_email" name="admin_contact_email" type="email" value={channelData.admin_contact_email} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms_accepted" name="terms_accepted" checked={channelData.terms_accepted} onCheckedChange={(checked) => handleInputChange({ target: { name: "terms_accepted", type: "checkbox", checked }})}/>
              <Label htmlFor="terms_accepted" className="text-sm font-normal">
                {getTranslation(language, "iConfirmOwnershipAndAccuracy")}
              </Label>
            </div>

            <CardFooter className="px-0 pt-6">
              <Button type="submit" className="w-full" disabled={submitting || fetchLoading || uploadingAvatar}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {getTranslation(language, "submitting")}
                  </>
                ) : (
                  getTranslation(language, "submitForReview")
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
