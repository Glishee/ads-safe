import React, { useState, useEffect } from "react";
import { TelegramChannel } from "@/api/entities";
import ChannelCard from "./channel-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTranslation } from "@/components/translation/translations";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useLanguage } from "@/components/contexts/LanguageContext";

export default function ChannelList() {
  const { language } = useLanguage();
  const [channels, setChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
  const fetchChannels = async () => {
    try {
      const allChannels = await TelegramChannel.filter({ is_approved: true }); // ✅ только одобренные

      const mapped = allChannels.map((ch) => {
        const id = ch.id || (ch._id && ch._id.toString());
        return {
          ...ch,
          id: id || Math.random().toString(36).slice(2)
        };
      });

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
        channel =>
          channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (channel.description && channel.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (categoryFilter !== "all") {
      results = results.filter(channel => channel.category === categoryFilter);
    }

    setFilteredChannels(results);
  }, [channels, searchTerm, categoryFilter]);

  const categories = ["all", "tech", "business", "entertainment", "news", "lifestyle", "education", "other"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className={`absolute ${language === 'he' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4`} />
          <Input
            placeholder={getTranslation(language, "searchChannels")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={language === 'he' ? 'pr-10' : 'pl-10'}
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={setCategoryFilter}
          dir={language === "he" ? "rtl" : "ltr"}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder={getTranslation(language, "filterByCategory")} />
          </SelectTrigger>
          <SelectContent align={language === "he" ? "end" : "start"}>
            <SelectGroup>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {getTranslation(language, cat === "all" ? "allCategories" : cat)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="h-32 w-full" />
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <div className="flex justify-between items-center mt-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
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
              <ChannelCard channel={channel} language={language} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
