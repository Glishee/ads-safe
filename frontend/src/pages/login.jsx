import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import LoginForm from "@/components/auth/login-form";
import { useLanguage } from "@/components/contexts/LanguageContext";

export default function Login() {
  useEffect(() => { document.title = "Login — AdMarket"; }, []);
  const navigate = useNavigate();
  const { language } = useLanguage();

  useEffect(() => {
  const checkIfLoggedIn = async () => {
    try {
      const user = await User.me();
      if (user.role === "admin") {
        navigate(createPageUrl("AdminDashboard"));
      } else if (user.application_role === "channel_owner") {
        navigate(createPageUrl("ChannelOwnerDashboard"));
      } else if (user.application_role === "advertiser") {
        navigate(createPageUrl("AdvertiserDashboard"));
      }
    } catch (err) {
      console.log("Not logged in:", err.message); 
    }
  };

  checkIfLoggedIn();
}, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex justify-center">
        <LoginForm language={language} />
      </div>
    </div>
  );
}
