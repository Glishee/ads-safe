import React from "react";
import ChannelList from "@/components/telegram/channel-list";
import { getTranslation } from "@/components/translation/translations";
import { useLanguage } from "@/components/contexts/LanguageContext";

export default function ChannelsList() {
  const { language } = useLanguage();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">
        {getTranslation(language, "telegramChannels")}
      </h1>
      <ChannelList />
    </div>
  );
}