import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, AdRequest, TelegramChannel } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Clock, ImagePlus, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getTranslation } from "@/components/translation/translations";
import { moderateContent } from "@/components/integrations/ContentModeration";
import { useLanguage } from "@/components/contexts/LanguageContext";

export default function AdRequestForm() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const channelId = searchParams.get("channelid");

  const [user, setUser] = useState(null);
  const [channel, setChannel] = useState(null);
  const [adText, setAdText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [timeSlots, setTimeSlots] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    setTimeSlots(slots);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);

        if (!channelId) {
          setError(getTranslation(language, "missingChannelId"));
          setLoading(false);
          return;
        }

        const channelData = await TelegramChannel.getById(channelId);
        if (!channelData || !channelData.is_approved) {
          setError(getTranslation(language, "channelNotApproved"));
          setLoading(false);
          return;
        }

        setChannel(channelData);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow.toISOString().split("T")[0]);
      } catch (err) {
        console.error(err);
        setError(getTranslation(language, "errorLoadingChannel"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [channelId, language, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/webm"];

    if (file.size > maxSize || !allowedTypes.includes(file.type)) {
      setError(getTranslation(language, "invalidFileType"));
      return;
    }

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adText) return setError(getTranslation(language, "adTextRequired"));

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const publicationTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const moderation = await moderateContent(adText);

      const formData = new FormData();
      formData.append("advertiser_id", user.id);
      formData.append("channel_id", channelId);
      formData.append("ad_text", adText);
      formData.append("price", channel.post_price);
      formData.append("publication_time", publicationTime.toISOString());
      formData.append("is_suspicious", moderation.containsProhibitedContent);
      formData.append("status", moderation.containsProhibitedContent ? "pending_admin_review" : "pending");
      formData.append("admin_approved", false);
      formData.append("owner_approved", false);
      if (moderation.containsProhibitedContent) {
        formData.append("moderation_info", JSON.stringify(moderation));
      }
      // Send the file directly — backend uploads to Cloudinary
      if (mediaFile) formData.append("media", mediaFile);

      await AdRequest.create(formData);
      setSuccess(getTranslation(language, "adRequestSubmittedSuccess"));
      setTimeout(() => navigate(createPageUrl("AdvertiserDashboard?tab=orders")), 2000);
    } catch (err) {
      console.error(err);
      setError(getTranslation(language, "errorSubmittingRequest"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <p>{getTranslation(language, "loading")}</p>;
  if (error) return <Alert variant="destructive"><AlertCircle /> <AlertDescription>{error}</AlertDescription></Alert>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {channel && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {channel.avatar_url ? (
                <img src={channel.avatar_url} alt={channel.name} className="w-16 h-16 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
                  <span className="text-blue-700 text-2xl font-bold">{channel.name?.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold truncate">{channel.name}</h2>
                {channel.description && <p className="text-sm text-gray-600 line-clamp-2">{channel.description}</p>}
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span>👥 {channel.subscribers_count?.toLocaleString()} {getTranslation(language, "subscribers")}</span>
                  <span>💰 ₪{channel.post_price} {getTranslation(language, "perPost")}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>{getTranslation(language, "adRequestTitle")}</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <Label>{getTranslation(language, "adText")}</Label>
          <Textarea value={adText} onChange={e => setAdText(e.target.value)} />

          <div className="flex flex-wrap gap-4 items-center">
            <Input
              type="date"
              value={selectedDate || ""}
              min={new Date().toISOString().split("T")[0]}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-auto"
            />
            <div className="flex items-center gap-2">
              <Clock className="text-gray-400 h-4 w-4" />
              <select value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="border rounded px-2 py-1 text-sm">
                {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">{getTranslation(language, "uploadMedia")}</Label>
            {mediaPreview ? (
              <div className="relative inline-block">
                {mediaFile.type.startsWith("image/") ? (
                  <img src={mediaPreview} className="max-h-48 rounded-xl border object-contain" alt="Preview" />
                ) : (
                  <video src={mediaPreview} className="max-h-48 rounded-xl border" controls />
                )}
                <button
                  type="button"
                  onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <ImagePlus className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">{getTranslation(language, "uploadMedia")}</span>
                <span className="text-xs text-gray-400 mt-0.5">JPG, PNG, GIF, MP4 · max 10MB</span>
                <input type="file" className="hidden" onChange={handleFileChange} accept="image/jpeg,image/png,image/gif,video/mp4,video/webm" />
              </label>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate(createPageUrl("ChannelsList"))}>{getTranslation(language, "cancel")}</Button>
          <Button type="submit" disabled={isSubmitting}>{getTranslation(language, isSubmitting ? "submitting" : "submitRequest")}</Button>
        </CardFooter>
      </Card>
    </form>
  );
}
