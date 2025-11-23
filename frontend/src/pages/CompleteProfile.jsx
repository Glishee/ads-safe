import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getTranslation } from "@/components/translation/translations";
import { AlertCircle, Check, UserCog } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    username: "",
    application_role: "advertiser", // Changed from 'role' to 'application_role'
  });
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        setLanguage(userData.language_preference || "en");
        
        // If profile is already complete (has username and application_role), redirect
        if (userData.username && userData.application_role) {
          if (userData.role === "admin") navigate(createPageUrl("AdminDashboard")); // Platform admin
          else if (userData.application_role === "channel_owner") navigate(createPageUrl("ChannelOwnerDashboard"));
          else if (userData.application_role === "advertiser") navigate(createPageUrl("AdvertiserDashboard"));
          return;
        }
        
        setFormData({
          username: userData.username || userData.full_name || "",
          application_role: userData.application_role || "advertiser" // Use application_role
        });
        
      } catch (err) {
        navigate(createPageUrl("Home"));
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleRoleChange = (value) => {
    setFormData((prev) => ({ ...prev, application_role: value })); // Update application_role
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!formData.username.trim()) {
      setError(getTranslation(language, "usernameRequired"));
      return;
    }
    
    setLoading(true);
    try {
      await User.updateMyUserData({
        username: formData.username,
        application_role: formData.application_role, // Send application_role
        language_preference: language 
      });
      
      if (user.role === "admin") navigate(createPageUrl("AdminDashboard")); // Platform admin
      else if (formData.application_role === "channel_owner") {
        navigate(createPageUrl("ChannelOwnerDashboard"));
      } else if (formData.application_role === "advertiser") {
        navigate(createPageUrl("AdvertiserDashboard"));
      } else {
         navigate(createPageUrl("Home")); // Fallback
      }
    } catch (err) {
      setError(getTranslation(language, "profileUpdateFailed"));
      console.error("Profile update error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <UserCog className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <CardTitle className="text-2xl font-bold tracking-tight">
            {getTranslation(language, "completeProfile")}
          </CardTitle>
          <CardDescription>
            {getTranslation(language, "profileInfoNeeded")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">
                {getTranslation(language, "username")}
              </Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full"
                placeholder={getTranslation(language, "enterUsername")}
              />
            </div>

            <div className="space-y-3">
              <Label>{getTranslation(language, "chooseRole")}</Label>
              <RadioGroup 
                value={formData.application_role} // Use application_role
                onValueChange={handleRoleChange}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <Label htmlFor="advertiser" className={`flex flex-col items-start space-y-1 p-4 rounded-lg border cursor-pointer transition-colors ${formData.application_role === 'advertiser' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center w-full">
                    <RadioGroupItem value="advertiser" id="advertiser" className="mr-2" />
                    <span className="font-medium">{getTranslation(language, "advertiserRole")}</span>
                  </div>
                  <span className="text-sm text-gray-500 pl-6">{getTranslation(language, "advertiserDesc")}</span>
                </Label>
                <Label htmlFor="channel_owner" className={`flex flex-col items-start space-y-1 p-4 rounded-lg border cursor-pointer transition-colors ${formData.application_role === 'channel_owner' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                   <div className="flex items-center w-full">
                    <RadioGroupItem value="channel_owner" id="channel_owner" className="mr-2" />
                    <span className="font-medium">{getTranslation(language, "channelOwnerRole")}</span>
                  </div>
                  <span className="text-sm text-gray-500 pl-6">{getTranslation(language, "channelOwnerDesc")}</span>
                </Label>
              </RadioGroup>
            </div>
            <CardFooter className="px-0 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {getTranslation(language, "loading")}
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    {getTranslation(language, "completeRegistration")}
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}