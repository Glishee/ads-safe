
import "@/styles/rtl.css";
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  AlertCircle,
  ListOrdered,
  Globe,
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
  const location = useLocation();
  const { language, toggleLanguage } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [blockedError, setBlockedError] = useState(false);
  
  const publicPages = ["Home", "Login", "Register", "VerifyEmail", "TermsOfService", "PrivacyPolicy", "ContactUs"];
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
        setUser(null);
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
        { name: "manageChannels", path: "AdminChannels", icon: <MessageSquare className="h-5 w-5" /> },
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
                    support@admarket.com
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
    const pageMap = {
      ChannelOwnerDashboard: "dashboard",
      ChannelOwnerAdRequests: "adRequests",
      ChannelOwnerStats: "statistics",
      AdminDashboard: "dashboard",
      AdminChannels: "pendingChannels",
      AdminUsers: "allUsers",
      AdminSettings: "systemSettings",
      AdvertiserDashboard: "dashboard",
      ChannelsList: "channels",
      MyOrders: "myOrders",
      AdvertiserStats: "statistics",
      MyChannels: "myChannels",
      AddChannel: "addChannel",
      AdRequest: "adRequests",
      AccountSettings: "accountSettings",
    };
    const key = pageMap[currentPageName] || currentPageName;
    return getTranslation(language, key) || currentPageName;
  };

  return (
    <RTLProvider language={language}>
      <div className={`bg-gray-50 relative ${isPublicPage ? "min-h-[100dvh] overflow-x-hidden" : "h-[100dvh] overflow-hidden"}`}>

        {isPublicPage && (
          <header className="bg-white shadow-sm py-3">
            <div className="container mx-auto px-4 flex justify-between items-center">
              <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
                <img src="/logo.png" alt="AdMarket" className="h-8 w-8 object-contain" />
                <span className="text-lg sm:text-xl font-bold">AdMarket</span>
              </Link>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 text-gray-500 text-sm px-2"
                  onClick={toggleLanguage}
                >
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">{language === "he" ? "EN" : "HE"}</span>
                </Button>
                {!user ? (
                  <>
                    <Link to={createPageUrl("Login")}>
                      <Button variant="outline" size="sm" className="text-sm px-3">
                        {getTranslation(language, "login")}
                      </Button>
                    </Link>
                    <Link to={createPageUrl("Register")}>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-sm px-3">
                        {getTranslation(language, "register")}
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-sm"
                    onClick={() => {
                      if (isAdmin) navigate(createPageUrl("AdminDashboard"));
                      else if (isChannelOwner) navigate(createPageUrl("ChannelOwnerDashboard"));
                      else if (isAdvertiser) navigate(createPageUrl("AdvertiserDashboard"));
                      else navigate(createPageUrl("CompleteProfile"));
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
          <div className="flex h-[100dvh] overflow-hidden">
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar — desktop always visible, mobile slide-over */}
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
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="AdMarket" className="h-8 w-8 object-contain" />
                  <h1 className="text-xl font-bold">AdMarket</h1>
                </div>
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
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{user?.username || user?.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {isAdmin ? getTranslation(language, "adminRole") :
                       isChannelOwner ? getTranslation(language, "channelOwnerRole") :
                       isAdvertiser ? getTranslation(language, "advertiserRole") :
                       getTranslation(language, "userRole")}
                    </p>
                  </div>
                </div>
              </div>

              <nav className="p-4 space-y-1">
                {getNavLinks().map((link) => {
                  const [linkPage, linkQuery] = link.path.split('?');
                  const isActive = (() => {
                    if (currentPageName !== linkPage) return false;
                    if (!linkQuery) return true;
                    const current = new URLSearchParams(location.search);
                    const required = new URLSearchParams(linkQuery);
                    for (const [k, v] of required) {
                      if (current.get(k) !== v) return false;
                    }
                    return true;
                  })();
                  return (
                    <Link
                      key={link.path}
                      to={createPageUrl(link.path)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                        ${isActive
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }
                      `}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className={isActive ? "text-blue-600" : "text-gray-400"}>
                        {link.icon}
                      </span>
                      <span>{getTranslation(language, link.name)}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="absolute bottom-0 left-0 right-0 p-4 border-t space-y-2">
                <Link
                  to={createPageUrl("AccountSettings")}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm
                    ${currentPageName === "AccountSettings"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Settings className={`h-5 w-5 ${currentPageName === "AccountSettings" ? "text-blue-600" : "text-gray-400"}`} />
                  {getTranslation(language, "accountSettings")}
                </Link>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start gap-2 text-gray-600 hover:bg-gray-100"
                  onClick={toggleLanguage}
                >
                  <Globe className="h-4 w-4 text-gray-400" />
                  {language === "he" ? "Switch to English" : "עבור לעברית"}
                </Button>
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
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Mobile top header — hamburger + title + user menu */}
              <header className="md:hidden bg-white border-b px-3 py-3 flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-base font-semibold truncate flex-1 text-center">
                  {currentPageName && currentPageDisplayName()}
                </h1>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-blue-600" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="truncate">{user?.username || user?.full_name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { navigate(createPageUrl("AccountSettings")); setSidebarOpen(false); }}>
                      <Settings className="h-4 w-4 mr-2" />
                      {getTranslation(language, "accountSettings")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      {getTranslation(language, "logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </header>

              <main className="flex-1 p-4 md:p-6 pb-8 overflow-y-auto overflow-x-hidden w-full min-w-0">
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

