import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import AdRequestForm from "@/components/telegram/ad-request-form";

export default function RequestAd() {
  const [language, setLanguage] = useState("en");
  const [channelId, setChannelId] = useState(null);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("channelId");
    setChannelId(id);
    
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
    <div className="container mx-auto max-w-4xl">
      <AdRequestForm channelId={channelId} language={language} />
    </div>
  );
}