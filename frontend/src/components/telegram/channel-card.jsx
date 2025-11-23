
import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Users, MessageSquare } from "lucide-react"; 
import { getTranslation } from "@/components/translation/translations"; 
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/contexts/LanguageContext";

export default function ChannelCard({ channel }) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  
 const handleRequestAd = () => {
  if (!channel?.id) {
    console.error("Missing channel ID");
    return;
  }
  navigate(createPageUrl(`RequestAd?channelId=${channel.id}`));
};
  
  const formatSubscribers = (count) => {
    if (!count) return '0';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg flex flex-col h-full">
      <div className="relative h-32 bg-gradient-to-r from-blue-400 to-purple-500">
        {channel.avatar_url ? (
          <img 
            src={channel.avatar_url} 
            alt={channel.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-200">
            <MessageSquare className="h-12 w-12 text-gray-400"/>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
          <h3 className="text-lg font-bold text-white truncate" title={channel.name}>{channel.name}</h3>
        </div>
      </div>
      
      <CardContent className="p-4 flex-grow">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className="flex items-center gap-1 text-xs py-1 px-2">
            <Users className="h-3 w-3" />
            {formatSubscribers(channel.subscribers_count)} {getTranslation(language, "subscribers")}
          </Badge>
          <Badge className="bg-blue-100 text-blue-800 text-xs py-1 px-2">
            {getTranslation(language, channel.category) || channel.category}
          </Badge>
        </div>
        
        <p className={`text-sm text-gray-600 line-clamp-3 h-[3.75rem] leading-relaxed ${language === 'he' ? 'text-right' : ''}`}>
          {channel.description}
        </p>
        
        <div className="mt-3 flex items-center justify-between">
          <span className="font-bold text-lg text-green-600">
            ${channel.post_price?.toFixed(2)}
          </span>
          <span className="text-xs text-gray-500">
            {getTranslation(language, "postPrice")}
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="p-3 pt-0 flex gap-2 border-t mt-auto">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 w-1/2"
          onClick={() => window.open(channel.telegram_link, "_blank")}
          title={getTranslation(language, "viewChannelOnTelegram")}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {getTranslation(language, "viewChannel")}
        </Button>
        <Button 
          className="w-1/2 bg-blue-600 hover:bg-blue-700"
          size="sm"
          onClick={handleRequestAd}
        >
          {getTranslation(language, "requestAd")}
        </Button>
      </CardFooter>
    </Card>
  );
}
