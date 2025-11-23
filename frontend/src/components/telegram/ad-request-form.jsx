import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, AdRequest, TelegramChannel } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Calendar, Clock, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
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
        setSelectedDate(tomorrow);
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

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("http://localhost:5000/api/upload", { method: "POST", body: formData });
    return await res.json();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adText) return setError(getTranslation(language, "adTextRequired"));

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      let mediaUrl = null;
      if (mediaFile) {
        const uploadRes = await uploadFile(mediaFile);
        mediaUrl = uploadRes.url;
      }

      const [h, m] = selectedTime.split(":").map(Number);
      const publicationTime = new Date(selectedDate);
      publicationTime.setHours(h, m, 0, 0);

      const moderation = await moderateContent(adText);
      const formData = new FormData();

      formData.append("advertiser_id", user.id);
      formData.append("channel_id", channelId);
      formData.append("ad_text", adText);
      formData.append("media_url", mediaUrl || "");
      formData.append("price", channel.post_price);
      formData.append("publication_time", publicationTime.toISOString());
      formData.append("is_suspicious", moderation.containsProhibitedContent);
      formData.append("status", moderation.containsProhibitedContent ? "pending_admin_review" : "pending");
      formData.append("admin_approved", false);
      formData.append("owner_approved", false);
      if (moderation.containsProhibitedContent) {
        formData.append("moderation_info", JSON.stringify(moderation));
      }
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
      <Card>
        <CardHeader><CardTitle>{getTranslation(language, "adRequestTitle")}</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <Label>{getTranslation(language, "adText")}</Label>
          <Textarea value={adText} onChange={e => setAdText(e.target.value)} />

          <div className="flex gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Calendar className="mr-2" /> {selectedDate ? format(selectedDate, "PPP") : getTranslation(language, "pickDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <CalendarComponent selected={selectedDate} onSelect={setSelectedDate} disabled={d => d < new Date()} />
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-2">
              <Clock className="text-gray-400" />
              <select value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="border rounded px-2 py-1">
                {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
              </select>
            </div>
          </div>

          <Label>{getTranslation(language, "uploadMedia")}</Label>
          <Input type="file" onChange={handleFileChange} />
          {mediaPreview && (mediaFile.type.startsWith("image/")
            ? <img src={mediaPreview} className="mt-2 max-w-full h-auto" alt="Preview" />
            : <video src={mediaPreview} className="mt-2 max-w-full h-auto" controls />)}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate(createPageUrl("ChannelsList"))}>{getTranslation(language, "cancel")}</Button>
          <Button type="submit" disabled={isSubmitting}>{getTranslation(language, isSubmitting ? "submitting" : "submitRequest")}</Button>
        </CardFooter>
      </Card>
    </form>
  );
}
