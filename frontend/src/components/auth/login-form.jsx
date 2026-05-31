
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Translate from "@/components/translation/translate";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginForm({ language }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // In a real implementation, this would be a real authentication call
      // For now, we'll simulate it with User.login()
      const user = await User.login({ email, password });

      if (user.role === "admin") {
        navigate(createPageUrl("AdminDashboard"));
      } else if (user.application_role === "channel_owner") {
        navigate(createPageUrl("ChannelOwnerDashboard"));
      } else {
        navigate(createPageUrl("AdvertiserDashboard"));
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          <Translate language={language} textKey="login" />
        </h1>
        <p className="text-sm text-gray-500">
          <Translate language={language} textKey="welcome" />
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">
            <Translate language={language} textKey="email" />
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">
            <Translate language={language} textKey="password" />
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full"
          />
        </div>
        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <Translate language={language} textKey="loading" />
          ) : (
            <Translate language={language} textKey="login" />
          )}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm">
        <span className="text-gray-500">
          <Translate language={language} textKey="noAccount" />
        </span>{" "}
        <Button 
          variant="link" 
          className="p-0"
          onClick={() => navigate(createPageUrl("Register"))}
        >
          <Translate language={language} textKey="register" />
        </Button>
      </div>
    </div>
  );
}
