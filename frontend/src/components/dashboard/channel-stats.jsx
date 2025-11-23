import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, BarChart2, Users, CreditCard } from "lucide-react";
import { getTranslation } from "@/components/translation/translations";

export default function ChannelStats({ channel, requests, language }) {
  // Calculate earnings for this channel
  const calculateEarnings = () => {
    if (!requests.length) return 0;
    return requests
      .filter(req => req.status === "completed")
      .reduce((total, req) => total + (req.price || 0), 0);
  };
  
  // Calculate pending requests count
  const getPendingCount = () => {
    return requests.filter(req => req.status === "pending").length;
  };
  
  // Calculate completed requests count
  const getCompletedCount = () => {
    return requests.filter(req => req.status === "completed").length;
  };
  
  // Earnings per subscriber (to show engagement value)
  const getEarningsPerSubscriber = () => {
    const earnings = calculateEarnings();
    const subscribers = channel?.subscribers_count || 0;
    if (subscribers <= 0) return 0;
    return earnings / subscribers * 1000; // Per 1000 subscribers
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-gray-500">
            {getTranslation(language, "totalEarnings")}
          </CardTitle>
          <DollarSign className="h-5 w-5 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${calculateEarnings().toFixed(2)}</div>
          <p className="text-xs text-gray-500 mt-1">
            {getTranslation(language, "fromCompletedAds")}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-gray-500">
            {getTranslation(language, "pendingRequests")}
          </CardTitle>
          <BarChart2 className="h-5 w-5 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{getPendingCount()}</div>
          <p className="text-xs text-gray-500 mt-1">
            {getTranslation(language, "waitingForApproval")}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-gray-500">
            {getTranslation(language, "subscribersCount")}
          </CardTitle>
          <Users className="h-5 w-5 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{channel?.subscribers_count?.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">
            {getTranslation(language, "potentialReach")}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-gray-500">
            {getTranslation(language, "value")}
          </CardTitle>
          <CreditCard className="h-5 w-5 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${getEarningsPerSubscriber().toFixed(2)}</div>
          <p className="text-xs text-gray-500 mt-1">
            {getTranslation(language, "per1000Subscribers")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}