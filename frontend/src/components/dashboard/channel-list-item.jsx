import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, ExternalLink, Eye } from "lucide-react";
import { getTranslation } from "@/components/translation/translations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ChannelListItem({
  channel,
  language,
  viewAdRequests,
  isAdmin = false,
  onApprove,
  onReject
}) {
  const navigate = useNavigate();

  const statusBadgeColors = {
    approved: "bg-green-100 text-green-800 border-green-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    rejected: "bg-red-100 text-red-800 border-red-200"
  };

  const formatSubscribers = (count) => {
    if (!count) return "0";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleEdit = () => {
    navigate(createPageUrl(`EditChannel?id=${channel.id}`));
  };

  const handleViewRequests = () => {
    viewAdRequests(channel.id);
  };

  const statusKey = channel.is_approved
    ? "approved"
    : channel.is_rejected
    ? "rejected"
    : "pending";

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start md:items-center gap-4">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-blue-100 shrink-0">
          {channel.avatar_url ? (
            <img src={channel.avatar_url} alt={channel.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">{channel.name?.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2 items-center">
            <h3 className="font-semibold text-lg truncate">{channel.name}</h3>
            <Badge
              variant="outline"
              className={`${statusBadgeColors[statusKey]} border`}
            >
              {getTranslation(language, statusKey)}
            </Badge>
          </div>

          <p className="text-sm text-gray-500 truncate">{channel.description}</p>

          <div className="flex flex-wrap gap-4 mt-2 text-sm">
            <span className="text-gray-700">
              <span className="font-medium">${channel.post_price?.toFixed(2)}</span> /{" "}
              {getTranslation(language, "post")}
            </span>
            <span className="text-gray-700">
              <span className="font-medium">{formatSubscribers(channel.subscribers_count)}</span>{" "}
              {getTranslation(language, "subscribers")}
            </span>
            <Badge variant="secondary" className="font-normal">
              {getTranslation(language, channel.category)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap md:flex-nowrap gap-2 mt-2 md:mt-0 justify-end">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => window.open(channel.telegram_link, "_blank")}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {getTranslation(language, "view")}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={handleEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
          {getTranslation(language, "edit")}
        </Button>

        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
          onClick={handleViewRequests}
        >
          <Eye className="h-3.5 w-3.5" />
          {getTranslation(language, "adRequests")}
        </Button>

        {isAdmin && !channel.is_approved && !channel.is_rejected && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-300 hover:bg-green-50"
              onClick={() => onApprove(channel.id)}
            >
              {getTranslation(language, "approve")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => onReject(channel.id)}
            >
              {getTranslation(language, "reject")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
