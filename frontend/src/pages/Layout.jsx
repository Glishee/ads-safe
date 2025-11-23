
import "@/styles/rtl.css";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import LanguageSwitcher from "@/components/ui/language-switcher";
import RTLProvider from "@/components/ui/rtl-provider";
import { getTranslation } from "@/components/translation/translations";
import { LanguageProvider, useLanguage } from "@/components/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon, 
  Users, 
  BarChart2, 
  Home,
  MessageSquare,
  Settings,
  ChevronDown,
  AlertCircle,
  ListOrdered
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function LayoutContent({ children, currentPageName }) {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [blockedError, setBlockedError] = useState(false);
  
  const publicPages = ["Home", "Login", "Register"];
  const isPublicPage = publicPages.includes(currentPageName);

  // Determine roles based on new structure
  const isAdmin = user?.role === "admin"; // Platform admin
  const isAdvertiser = user?.application_role === "advertiser";
  const isChannelOwner = user?.application_role === "channel_owner";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await User.me();
        
        if (userData.is_blocked) {
          setBlockedError(true);
          setTimeout(() => {
            navigate(createPageUrl("Home"));
          }, 5000);
          return;
        }
        setUser(userData);


      } catch (error) {
        console.log("User not logged in or error fetching user:", error);
        if (!isPublicPage && currentPageName !== "Login") {
  navigate(createPageUrl("Login"));
}
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [currentPageName, navigate, isPublicPage]);

  const handleLogout = async () => {
    try {
      await User.logout();
      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getNavLinks = () => {
    if (isAdmin) { // Platform admin
      return [
        { name: "dashboard", path: "AdminDashboard", icon: <Home className="h-5 w-5" /> },
        { name: "pendingChannels", path: "AdminChannels?status=pending", icon: <MessageSquare className="h-5 w-5" /> },
        { name: "approvedChannels", path: "AdminChannels?status=approved", icon: <Users className="h-5 w-5" /> },
        { name: "allUsers", path: "AdminUsers", icon: <UserIcon className="h-5 w-5" /> },
        { name: "systemSettings", path: "AdminSettings", icon: <Settings className="h-5 w-5" /> }
      ];
    }
    
    if (isChannelOwner) {
      return [
        { name: "dashboard", path: "ChannelOwnerDashboard", icon: <Home className="h-5 w-5" /> }, // Overview
        { name: "myChannels", path: "MyChannels", icon: <MessageSquare className="h-5 w-5" /> },
        { name: "adRequests", path: "ChannelOwnerAdRequests", icon: <ListOrdered className="h-5 w-5" /> }, // New Page
        { name: "statistics", path: "ChannelOwnerStats", icon: <BarChart2 className="h-5 w-5" /> } // New Page
      ];
    }
    
    if (isAdvertiser) {
      return [
        { name: "dashboard", path: "AdvertiserDashboard", icon: <Home className="h-5 w-5" /> },
        { name: "channels", path: "ChannelsList", icon: <MessageSquare className="h-5 w-5" /> },
        { name: "myOrders", path: "MyOrders", icon: <ListOrdered className="h-5 w-5" /> }, // Assuming MyOrders exists or will be created
        { name: "statistics", path: "AdvertiserStats", icon: <BarChart2 className="h-5 w-5" /> } // Assuming AdvertiserStats exists
      ];
    }
    
    return [];
  };

  const shouldShowSidebar = !isPublicPage && user;

  if (blockedError) {
    return (
      <RTLProvider language={language}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Card className="border-red-200">
              <CardHeader>
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <CardTitle className="text-red-600">
                    {getTranslation(language, "accountBlocked")}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  {getTranslation(language, "accountBlockedMessage")}
                </p>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600">
                    {getTranslation(language, "contactSupportMessage")}
                  </p>
                  <p className="text-sm font-medium text-red-700 mt-2">
                    support@teleads.com
                  </p>
                </div>
                <Button 
                  className="w-full mt-4"
                  onClick={() => navigate(createPageUrl("Home"))}
                >
                  {getTranslation(language, "backToHome")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </RTLProvider>
    );
  }
  
  if (loading && !isPublicPage) {
    return (
      <RTLProvider language={language}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">{getTranslation(language, "loading")}</p>
          </div>
        </div>
      </RTLProvider>
    );
  }

  const currentPageDisplayName = () => {
    if (!user) return currentPageName;

    let baseName = currentPageName;
    if (currentPageName === "ChannelOwnerDashboard") baseName = "dashboard";
    else if (currentPageName === "ChannelOwnerAdRequests") baseName = "adRequests";
    else if (currentPageName === "ChannelOwnerStats") baseName = "statistics";
    // Add other page name mappings if needed

    return getTranslation(language, baseName);
  }

  return (
    <RTLProvider language={language}>
      <div className="min-h-screen bg-gray-50 relative">
        {/* Language switcher */}
        <div 
          className={`fixed bottom-4 ${language === "he" ? "left-4" : "right-4"} z-50`}
          style={{
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px'
          }}
        >
          <LanguageSwitcher currentLanguage={language} onToggle={toggleLanguage} />
        </div>
        
        {isPublicPage && (
          <header className="bg-white shadow-sm py-4">
            <div className="container mx-auto px-4 flex justify-between items-center">
              <Link to={createPageUrl("Home")} className="text-xl font-bold">
                TeleAds
              </Link>
              <div className="flex items-center space-x-4">
                {!user ? (
                  <>
                    <Link to={createPageUrl("Login")}>
                      <Button variant="outline">
                        {getTranslation(language, "login")}
                      </Button>
                    </Link>
                    <Link to={createPageUrl("Register")}>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        {getTranslation(language, "register")}
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-1"
                    onClick={() => {
                      if (isAdmin) navigate(createPageUrl("AdminDashboard"));
                      else if (isChannelOwner) navigate(createPageUrl("ChannelOwnerDashboard"));
                      else if (isAdvertiser) navigate(createPageUrl("AdvertiserDashboard"));
                      else navigate(createPageUrl("CompleteProfile")); // Fallback
                    }}
                  >
                    {getTranslation(language, "dashboard")}
                  </Button>
                )}
              </div>
            </div>
          </header>
        )}

        {shouldShowSidebar ? (
          <div className="flex h-screen overflow-hidden">
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            
            <aside className={`
              fixed top-0 ${language === "he" ? "right-0" : "left-0"} 
              w-64 h-full bg-white border-${language === "he" ? "l" : "r"} z-50
              transform transition-transform duration-200 ease-in-out
              md:relative md:translate-x-0
              ${language === "he" 
                ? (sidebarOpen ? "translate-x-0" : "translate-x-full") 
                : (sidebarOpen ? "translate-x-0" : "-translate-x-full")
              }
            `}>
              <div className="flex items-center justify-between p-4 border-b">
                <h1 className="text-xl font-bold">TeleAds</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="p-4 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{user?.username || user?.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {isAdmin ? getTranslation(language, "adminRole") : 
                       isChannelOwner ? getTranslation(language, "channelOwnerRole") : 
                       isAdvertiser ? getTranslation(language, "advertiserRole") :
                       getTranslation(language, "userRole")} {/* Fallback */}
                    </p>
                  </div>
                </div>
              </div>
              
              <nav className="p-4 space-y-1">
                {getNavLinks().map((link) => (
                  <Link
                    key={link.path}
                    to={createPageUrl(link.path)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                      ${currentPageName === link.path.split('?')[0]
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {link.icon}
                    <span>{getTranslation(language, link.name)}</span>
                  </Link>
                ))}
              </nav>
              
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  {getTranslation(language, "logout")}
                </Button>
              </div>
            </aside>
            
            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
              {/* Mobile header */}
              <header className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                
                <h1 className="text-lg font-semibold">
                  {currentPageName && currentPageDisplayName()}
                </h1>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <UserIcon className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{user?.username || user?.full_name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      {getTranslation(language, "logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </header>
              
              {/* Page content */}
              <main className="flex-1 p-4 md:p-6 overflow-auto">
                {children}
              </main>
            </div>
          </div>
        ) : (
          <main className={isPublicPage ? "" : "pt-16"}>
            {children}
          </main>
        )}
        
        
      </div>
    </RTLProvider>
  );
}

export default function Layout(props) {
  return (
    <LanguageProvider>
      <LayoutContent {...props} />
    </LanguageProvider>
  );
}

