
import React, { useEffect } from "react";
import { User } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import RegisterForm from "@/components/auth/register-form";
import { useLanguage } from "@/components/contexts/LanguageContext";

export default function Register() {
  useEffect(() => { document.title = "Register — AdMarket"; }, []);
  const navigate = useNavigate();
  const { language } = useLanguage();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await User.me();
        if (user.role === "admin") {
          navigate(createPageUrl("AdminDashboard"));
        } else if (user.role === "channel_owner") {
          navigate(createPageUrl("ChannelOwnerDashboard"));
        } else {
          navigate(createPageUrl("AdvertiserDashboard"));
        }
      } catch (error) {
        // User is not logged in, show registration form
      }
    };

    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-md">
        <RegisterForm language={language} />
      </div>
    </div>
  );
}
