import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import ChannelList from "@/components/telegram/channel-list";

export default function ChannelsList() {
  const [language, setLanguage] = useState("en");
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        if (user.language_preference) {
          setLanguage(user.language_preference);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    
    fetchUser();
  }, []);

  return (
    <div className="container mx-auto space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold">
        {language === "en" ? "Telegram Channels" : "ערוצי טלגרם"}
      </h1>
      <ChannelList language={language} />
    </div>
  );
}