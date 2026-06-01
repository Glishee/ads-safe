
import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import Translate from "@/components/translation/translate";
import { User } from "@/api/entities";
import { MessageSquare, Users, Zap, ArrowRight, DollarSign, BarChart } from "lucide-react";
import { useLanguage } from "@/components/contexts/LanguageContext";

export default function Home() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [user, setUser] = React.useState(null);
  
  React.useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (error) {
        // User is not logged in - no action needed
      }
    };
    
    checkUser();
  }, []);
  
  const goToDashboard = () => {
    if (!user) {
      navigate(createPageUrl("Login"));
      return;
    }
    
    if (user.role === "admin") {
      navigate(createPageUrl("AdminDashboard"));
    } else if (user.role === "channel_owner") {
      navigate(createPageUrl("ChannelOwnerDashboard"));
    } else {
      navigate(createPageUrl("AdvertiserDashboard"));
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="pt-20 pb-32 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="animate-in fade-in slide-in-from-bottom-4 duration-700 text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <Translate language={language} textKey="heroTitle" />
          </h1>
          <p className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto">
            <Translate language={language} textKey="heroSubtitle" />
          </p>
          <div className="animate-in fade-in duration-700 delay-300 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={goToDashboard}
              className="text-lg py-6 px-8 bg-white text-blue-700 hover:bg-blue-50 shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              <Translate language={language} textKey="getStarted" />
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
      
      
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <Translate language={language} textKey="howItWorks" />
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              <Translate language={language} textKey="platformDescription" />
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-md p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                <Translate language={language} textKey="connectChannels" />
              </h3>
              <p className="text-gray-600">
                <Translate language={language} textKey="connectChannelsDesc" />
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                <Translate language={language} textKey="targetAudience" />
              </h3>
              <p className="text-gray-600">
                <Translate language={language} textKey="targetAudienceDesc" />
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                <Translate language={language} textKey="simplifiedProcess" />
              </h3>
              <p className="text-gray-600">
                <Translate language={language} textKey="simplifiedProcessDesc" />
              </p>
            </div>
          </div>
        </div>
      </section>
      
     
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                <Translate language={language} textKey="forAdvertisers" />
              </h2>
              <p className="text-gray-600 mb-6">
                <Translate language={language} textKey="forAdvertisersDesc" />
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                  <span>
                    <Translate language={language} textKey="reachMillions" />
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <span>
                    <Translate language={language} textKey="transparentPricing" />
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <BarChart className="h-4 w-4" />
                  </div>
                  <span>
                    <Translate language={language} textKey="detailedAnalytics" />
                  </span>
                </li>
              </ul>
              <Button 
                className="mt-8 bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate(createPageUrl("Register"))}
              >
                <Translate language={language} textKey="startAdvertising" />
              </Button>
            </div>
            
            <div className="order-first md:order-last">
              <img 
                src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&q=75&fit=crop&w=600" 
                alt="Advertisers dashboard" 
                className="rounded-xl shadow-lg"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-16 items-center mt-32">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&q=75&fit=crop&w=600" 
                alt="Channel owners" 
                className="rounded-xl shadow-lg"
              />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold mb-6">
                <Translate language={language} textKey="forChannelOwners" />
              </h2>
              <p className="text-gray-600 mb-6">
                <Translate language={language} textKey="forChannelOwnersDesc" />
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <span>
                    <Translate language={language} textKey="monetizeChannel" />
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <span>
                    <Translate language={language} textKey="controlContent" />
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                  <span>
                    <Translate language={language} textKey="growAudience" />
                  </span>
                </li>
              </ul>
              <Button 
                className="mt-8 bg-purple-600 hover:bg-purple-700"
                onClick={() => navigate(createPageUrl("Register"))}
              >
                <Translate language={language} textKey="becomePartner" />
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-blue-700 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            <Translate language={language} textKey="readyToStart" />
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            <Translate language={language} textKey="joinCommunity" />
          </p>
          <Button
            onClick={() => navigate(createPageUrl("Register"))}
            className="text-lg py-6 px-8 bg-white text-blue-700 hover:bg-blue-50 transition-transform hover:scale-105 active:scale-95"
          >
            <Translate language={language} textKey="createAccount" />
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-xl font-bold text-white">TeleAds</h3>
              <p className="mt-2">
                <Translate language={language} textKey="connectingAdvertisers" />
              </p>
            </div>
            
            <div className="flex gap-6">
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                <Translate language={language} textKey="termsOfService" />
              </Button>
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                <Translate language={language} textKey="privacyPolicy" />
              </Button>
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                <Translate language={language} textKey="contact" />
              </Button>
            </div>
          </div>
          
          <div className="mt-12 text-center text-sm">
            <p>© 2023 TeleAds. <Translate language={language} textKey="allRightsReserved" /></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
