import React, { useState, useEffect } from "react";
import { TelegramChannel } from "@/api/entities";
import ChannelCard from "./channel-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTranslation } from "@/components/translation/translations";
import { Search, ExternalLink, Users, DollarSign, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

function ChannelModal({ channel, onClose, language, onRequestAd }) {
  if (!channel) return null;

  const formatSubscribers = (count) => {
    if (!count) return "0";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const cpm = channel.subscribers_count > 0 && channel.post_price
    ? ((channel.post_price / channel.subscribers_count) * 1000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir={language === "he" ? "rtl" : "ltr"}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Hero image */}
        <div className="relative h-48 bg-gradient-to-r from-blue-400 to-purple-500 shrink-0">
          {channel.avatar_url ? (
            <img
              src={channel.avatar_url}
              alt={channel.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <h2 className="text-xl font-bold text-white">{channel.name}</h2>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1 text-sm py-1 px-3">
              <Users className="h-3.5 w-3.5" />
              {formatSubscribers(channel.subscribers_count)} {getTranslation(language, "subscribers")}
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 text-sm py-1 px-3">
              {getTranslation(language, channel.category) || channel.category}
            </Badge>
          </div>

          {/* Description — full, no clamp */}
          {channel.description && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                {getTranslation(language, "channelDescription")}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {channel.description}
              </p>
            </div>
          )}

          {/* Pricing stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-green-700">₪{channel.post_price?.toFixed(2)}</div>
              <div className="text-xs text-green-600 mt-0.5">{getTranslation(language, "postPrice")}</div>
            </div>
            {cpm && (
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-blue-700">₪{cpm}</div>
                <div className="text-xs text-blue-600 mt-0.5">{getTranslation(language, "per1000Subscribers")}</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="shrink-0 flex gap-3 p-4 border-t bg-gray-50">
          <Button
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={() => window.open(channel.telegram_link, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
            {getTranslation(language, "viewChannel")}
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onRequestAd}
          >
            {getTranslation(language, "requestAd")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ChannelList() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedChannel, setSelectedChannel] = useState(null);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const allChannels = await TelegramChannel.filter({ is_approved: true });
        const mapped = allChannels.map((ch) => ({
          ...ch,
          id: ch.id || (ch._id && ch._id.toString()) || Math.random().toString(36).slice(2),
        }));
        setChannels(mapped);
        setFilteredChannels(mapped);
      } catch (error) {
        console.error("Error fetching channels:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, []);

  useEffect(() => {
    let results = channels;
    if (searchTerm) {
      results = results.filter(
        (ch) =>
          ch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ch.description && ch.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (categoryFilter !== "all") {
      results = results.filter((ch) => ch.category === categoryFilter);
    }
    setFilteredChannels(results);
  }, [channels, searchTerm, categoryFilter]);

  const categories = ["all", "tech", "business", "entertainment", "news", "lifestyle", "education", "other"];

  const handleRequestAd = () => {
    if (!selectedChannel?.id) return;
    setSelectedChannel(null);
    navigate(createPageUrl(`RequestAd?channelId=${selectedChannel.id}`));
  };

  return (
    <div className="space-y-6">
      {/* Search + filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className={`absolute ${language === "he" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4`} />
          <Input
            placeholder={getTranslation(language, "searchChannels")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={language === "he" ? "pr-10" : "pl-10"}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter} dir={language === "he" ? "rtl" : "ltr"}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder={getTranslation(language, "filterByCategory")} />
          </SelectTrigger>
          <SelectContent align={language === "he" ? "end" : "start"}>
            <SelectGroup>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {getTranslation(language, cat === "all" ? "allCategories" : cat)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-32 w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
              <CardFooter className="p-3 pt-0 flex gap-2">
                <Skeleton className="h-9 w-1/2" />
                <Skeleton className="h-9 w-1/2" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredChannels.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">
            {searchTerm || categoryFilter !== "all"
              ? getTranslation(language, "noChannelsFound")
              : getTranslation(language, "noChannelsYet")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChannels.map((channel, index) => (
            <div
              key={channel.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <ChannelCard
                channel={channel}
                language={language}
                onCardClick={setSelectedChannel}
              />
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedChannel && (
        <ChannelModal
          channel={selectedChannel}
          language={language}
          onClose={() => setSelectedChannel(null)}
          onRequestAd={handleRequestAd}
        />
      )}
    </div>
  );
}
