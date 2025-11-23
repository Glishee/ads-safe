import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTranslation } from "@/components/translation/translations";
import { Check, X, ExternalLink } from "lucide-react";

export default function AdRequestItem({ request, channel, language, onUpdateStatus }) {
  const statusBadgeColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-blue-100 text-blue-800 border-blue-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    canceled: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  
  const renderStatusActions = () => {
    if (request.status === "pending") {
      return (
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm"
            className="text-red-500 hover:text-red-700 flex items-center gap-1"
            onClick={() => onUpdateStatus(request.id, "rejected")}
          >
            <X className="h-3.5 w-3.5" />
            {getTranslation(language, "reject")}
          </Button>
          
          <Button 
            size="sm"
            className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
            onClick={() => onUpdateStatus(request.id, "approved")}
          >
            <Check className="h-3.5 w-3.5" />
            {getTranslation(language, "approve")}
          </Button>
        </div>
      );
    }
    
    if (request.status === "approved") {
      return (
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onUpdateStatus(request.id, "completed")}
          >
            {getTranslation(language, "markAsCompleted")}
          </Button>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`${statusBadgeColors[request.status]} border`}>
              {getTranslation(language, request.status)}
            </Badge>
            <span className="text-sm text-gray-500">
              {new Date(request.created_date).toLocaleDateString()}
            </span>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
            {request.ad_text}
          </div>
          
          {request.media_url && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => window.open(request.media_url, "_blank")}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {getTranslation(language, "viewMedia")}
              </Button>
            </div>
          )}
          
          <div className="mt-3 text-sm">
            <div className="flex justify-between items-center">
              <div className="font-medium">{getTranslation(language, "price")}</div>
              <div className="font-bold">${request.price?.toFixed(2)}</div>
            </div>
          </div>
          
          {renderStatusActions()}
        </div>
      </div>
    </div>
  );
}