"use client";

import React, { useState } from "react";
import { api } from "@/client/trpc";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/Modal";
import { formatDistanceToNow } from "date-fns";
import { X, ExternalLink, Calendar, User } from "lucide-react";

interface UpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpdatesModal({ isOpen, onClose }: UpdatesModalProps) {
  const [selectedUpdate, setSelectedUpdate] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const { data: updatesData, isLoading } = api.communityUpdates.getUpdates.useQuery({
    limit: 20,
    category: selectedCategory,
  });

  const { data: updateDetails } = api.communityUpdates.getUpdateDetails.useQuery(
    { id: selectedUpdate! },
    { enabled: !!selectedUpdate }
  );

  const markAsReadMutation = api.communityUpdates.markAsRead.useMutation();
  const trackClickMutation = api.communityUpdates.trackClick.useMutation();

  const handleUpdateClick = async (updateId: string) => {
    setSelectedUpdate(updateId);
    await markAsReadMutation.mutateAsync({ updateId });
  };

  const handleCtaClick = async (updateId: string, ctaLink: string) => {
    await trackClickMutation.mutateAsync({ updateId });
    window.open(ctaLink, '_blank');
  };

  const categories = [
    { value: undefined, label: "All Updates" },
    { value: "announcement", label: "Announcements" },
    { value: "promotion", label: "Promotions" },
    { value: "news", label: "News" },
    { value: "event", label: "Events" },
    { value: "policy", label: "Policies" },
    { value: "success", label: "Success Stories" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "LOW":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "announcement":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "promotion":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "news":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "event":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      case "policy":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "success":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex flex-col h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Community Updates</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Stay informed with the latest news and announcements
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 p-4 border-b border-border overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.value || 'all'}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.value
                  ? "bg-bpi-primary text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bpi-primary"></div>
            </div>
          ) : !updatesData?.updates || updatesData.updates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                No updates available
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Check back later for new announcements
              </p>
            </div>
          ) : selectedUpdate && updateDetails ? (
            /* Detail View */
            <div className="space-y-6">
              <button
                onClick={() => setSelectedUpdate(null)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to all updates
              </button>

              <Card className="p-6">
                {/* Image */}
                {updateDetails.imageUrl && (
                  <img
                    src={updateDetails.imageUrl}
                    alt={updateDetails.title}
                    className="w-full h-64 object-cover rounded-lg mb-6"
                  />
                )}

                {/* Title & Badges */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-2xl font-bold text-foreground flex-1">
                    {updateDetails.title}
                  </h3>
                  <div className="flex gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(updateDetails.priority)}`}>
                      {updateDetails.priority}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(updateDetails.category)}`}>
                      {updateDetails.category}
                    </span>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{updateDetails.creator.name || 'Admin'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDistanceToNow(new Date(updateDetails.publishedAt), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Content */}
                <div
                  className="prose dark:prose-invert max-w-none mb-6"
                  dangerouslySetInnerHTML={{ __html: updateDetails.content }}
                />

                {/* CTA */}
                {updateDetails.ctaLink && updateDetails.ctaText && (
                  <button
                    onClick={() => handleCtaClick(updateDetails.id, updateDetails.ctaLink!)}
                    className="flex items-center gap-2 bg-bpi-primary text-white px-6 py-3 rounded-lg hover:bg-bpi-secondary transition-colors"
                  >
                    {updateDetails.ctaText}
                    <ExternalLink className="h-4 w-4" />
                  </button>
                )}
              </Card>
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {updatesData.updates.map((update) => (
                <Card
                  key={update.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                    !update.isRead ? "border-l-4 border-l-bpi-primary" : ""
                  }`}
                  onClick={() => handleUpdateClick(update.id)}
                >
                  <div className="flex gap-4">
                    {update.imageUrl && (
                      <img
                        src={update.imageUrl}
                        alt={update.title}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-semibold ${!update.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {update.title}
                          {!update.isRead && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              New
                            </span>
                          )}
                        </h3>
                        <div className="flex gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(update.priority)}`}>
                            {update.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(update.category)}`}>
                            {update.category}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {update.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(update.publishedAt), { addSuffix: true })}</span>
                        <span>• {update.viewCount} views</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
