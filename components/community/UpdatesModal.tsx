"use client";

import { useState } from "react";
import { FiX, FiBell, FiExternalLink } from "react-icons/fi";
import { Bell, TrendingUp, AlertCircle, Calendar, Eye, Star, Filter } from "lucide-react";
import { api } from "@/client/trpc";

interface UpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpdatesModal({ isOpen, onClose }: UpdatesModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);

  const { data: updates, refetch } = api.communityUpdates.getUpdates.useQuery({
    limit: 50,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });

  const markAsReadMutation = api.communityUpdates.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const trackClickMutation = api.communityUpdates.trackClick.useMutation();

  if (!isOpen) return null;

  const categories = [
    { value: 'all', label: 'All Updates', icon: Bell },
    { value: 'announcement', label: 'Announcements', icon: AlertCircle },
    { value: 'promotion', label: 'Promotions', icon: Star },
    { value: 'news', label: 'News', icon: TrendingUp },
    { value: 'event', label: 'Events', icon: Calendar },
  ];

  const priorityColors = {
    HIGH: 'border-red-500 bg-red-50 dark:bg-red-900/20',
    MEDIUM: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    LOW: 'border-gray-300 dark:border-gray-700',
  };

  const categoryColors = {
    announcement: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    promotion: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    news: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    event: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
    policy: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30',
    success: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
  };

  const handleUpdateClick = (update: any) => {
    setSelectedUpdate(update);
    if (!update.isRead) {
      markAsReadMutation.mutate({ updateId: update.id });
    }
  };

  const handleCTAClick = (update: any) => {
    trackClickMutation.mutate({ updateId: update.id });
    if (update.ctaLink) {
      window.open(update.ctaLink, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-bpi-dark-card">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white shadow-lg">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                <FiBell className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Community Updates</h1>
                <p className="text-emerald-100 text-sm">Stay informed with the latest news and announcements</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <FiX className="w-7 h-7" />
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setSelectedCategory(value)}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg transition-all whitespace-nowrap ${
                  selectedCategory === value
                    ? 'bg-white text-emerald-600 shadow-lg font-semibold'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-180px)] overflow-y-auto">
        {!selectedUpdate ? (
          <div className="max-w-5xl mx-auto p-6 space-y-4">
            {updates && updates.length > 0 ? (
              updates.map((update: any) => (
                <div
                  key={update.id}
                  className={`bg-white dark:bg-bpi-dark-card border-l-4 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer ${
                    priorityColors[update.priority as keyof typeof priorityColors]
                  } ${!update.isRead ? 'ring-2 ring-emerald-500/20' : ''}`}
                  onClick={() => handleUpdateClick(update)}
                >
                  <div className="flex items-start gap-4">
                    {!update.isRead && (
                      <div className="flex-shrink-0 w-2 h-2 bg-emerald-500 rounded-full mt-2" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                              categoryColors[update.category as keyof typeof categoryColors]
                            }`}>
                              {update.category}
                            </span>
                            {update.priority === 'HIGH' && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-600">
                                Priority
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-foreground mb-2">{update.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{update.content.substring(0, 200)}...</p>
                        </div>
                        {update.imageUrl && (
                          <img
                            src={update.imageUrl}
                            alt={update.title}
                            className="w-24 h-24 object-cover rounded-lg ml-4"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(update.publishedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{update.viewCount} views</span>
                        </div>
                        {update.creator && (
                          <span>By {update.creator.firstname} {update.creator.lastname}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20">
                <Bell className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <p className="text-muted-foreground">No updates available</p>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto p-6">
            <button
              onClick={() => setSelectedUpdate(null)}
              className="text-emerald-600 hover:underline mb-6"
            >
              ← Back to updates
            </button>

            <article className="bg-white dark:bg-bpi-dark-card rounded-xl p-8 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                  categoryColors[selectedUpdate.category as keyof typeof categoryColors]
                }`}>
                  {selectedUpdate.category}
                </span>
                {selectedUpdate.priority === 'HIGH' && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-600">
                    High Priority
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-foreground mb-4">{selectedUpdate.title}</h1>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-bpi-border dark:border-bpi-dark-accent">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(selectedUpdate.publishedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{selectedUpdate.viewCount} views</span>
                </div>
                {selectedUpdate.creator && (
                  <span>By {selectedUpdate.creator.firstname} {selectedUpdate.creator.lastname}</span>
                )}
              </div>

              {selectedUpdate.imageUrl && (
                <img
                  src={selectedUpdate.imageUrl}
                  alt={selectedUpdate.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}

              <div className="prose dark:prose-invert max-w-none mb-8">
                {selectedUpdate.content.split('\n').map((para: string, i: number) => (
                  <p key={i} className="mb-4">{para}</p>
                ))}
              </div>

              {selectedUpdate.ctaText && selectedUpdate.ctaLink && (
                <button
                  onClick={() => handleCTAClick(selectedUpdate)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <span>{selectedUpdate.ctaText}</span>
                  <FiExternalLink className="w-4 h-4" />
                </button>
              )}
            </article>
          </div>
        )}
      </div>
    </div>
  );
}
