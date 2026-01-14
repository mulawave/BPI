"use client";

import React, { useState } from "react";
import { api } from "@/client/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Play,
  X,
  Users,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Search,
  ExternalLink,
  Youtube,
  Sparkles,
  Award,
  Clock,
} from "lucide-react";

interface BrowseChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BrowseChannelsModal({ isOpen, onClose }: BrowseChannelsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const utils = api.useUtils();

  // Queries
  const { data: channels, isLoading } = api.youtube.getVerifiedChannels.useQuery(undefined, {
    enabled: isOpen,
  });
  const { data: myEarnings } = api.youtube.getMyEarnings.useQuery(undefined, {
    enabled: isOpen,
  });
  const { data: mySubscription } = api.youtube.getMySubscription.useQuery(undefined, {
    enabled: isOpen,
  });

  // Mutations
  const subscribeToChannel = api.youtube.subscribeToChannel.useMutation({
    onSuccess: () => {
      utils.youtube.getVerifiedChannels.invalidate();
      utils.youtube.getMySubscription.invalidate();
    },
  });

  const claimEarnings = api.youtube.claimEarnings.useMutation({
    onSuccess: () => {
      utils.youtube.getMyEarnings.invalidate();
      utils.youtube.getMySubscription.invalidate();
      utils.user.getDetails.invalidate();
    },
  });

  const handleSubscribe = (channelId: string) => {
    subscribeToChannel.mutate({ channelId });
  };

  const handleClaim = (channelId: string) => {
    claimEarnings.mutate({ channelId });
  };

  const filteredChannels = channels?.filter((channel) => {
    const channelName = (channel.channelName ?? "").toLowerCase();
    const ownerName = `${channel.User.firstname ?? ""} ${channel.User.lastname ?? ""}`
      .trim()
      .toLowerCase();
    const query = searchQuery.toLowerCase();
    return channelName.includes(query) || ownerName.includes(query);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <Card className="bg-white dark:bg-gray-800 w-full max-w-6xl max-h-[90vh] shadow-2xl border-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Play className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Browse Channels</h2>
                <p className="text-emerald-100 text-sm">Subscribe and earn ₦40 per channel</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-emerald-100 text-xs mb-1">Total Earnings</p>
                  <p className="text-white text-lg font-bold">
                    ₦{myEarnings?.totalEarnings.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Youtube className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-emerald-100 text-xs mb-1">Total Earnings</p>
                  <p className="text-white text-lg font-bold">
                    ₦{(myEarnings?.totalEarnings || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-emerald-100 text-xs mb-1">Available Channels</p>
                  <p className="text-white text-lg font-bold">{channels?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading channels...</p>
              </div>
            </div>
          ) : filteredChannels && filteredChannels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChannels.map((channel: any) => {
                const mySubscriptionToThisChannel = mySubscription?.find(
                  (sub: any) => sub.channelId === channel.id
                );
                const isPending = mySubscriptionToThisChannel?.status === "pending";
                const canClaim = mySubscriptionToThisChannel?.status === "pending";

                return (
                  <Card
                    key={channel.id}
                    className="overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all hover:shadow-xl"
                  >
                    {/* Channel Header */}
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-6 border-b-2 border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Youtube className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground text-lg mb-1 truncate">
                            {channel.channelName}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">
                            by {`${channel.user.firstname ?? ""} ${channel.user.lastname ?? ""}`.trim() || "Anonymous"}
                          </p>
                        </div>
                      </div>

                      <a
                        href={channel.channelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                      >
                        Visit Channel
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Channel Stats */}
                    <div className="p-6 bg-white dark:bg-gray-800">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200 dark:border-green-800">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-medium text-muted-foreground">Earn</span>
                          </div>
                          <p className="text-xl font-bold text-green-600 dark:text-green-400">₦40</p>
                        </div>

                        <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-medium text-muted-foreground">Slots</span>
                          </div>
                          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {channel.remainingBalance}
                          </p>
                        </div>
                      </div>

                      {/* Status & Action */}
                      {mySubscriptionToThisChannel ? (
                        <div className="space-y-3">
                          {isPending ? (
                            <>
                              <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-800">
                                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                                  Subscription Pending
                                </span>
                              </div>
                              <Button
                                onClick={() => handleClaim(channel.id)}
                                disabled={claimEarnings.isPending}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-11 font-semibold"
                              >
                                {claimEarnings.isPending ? (
                                  "Processing..."
                                ) : (
                                  <>
                                    <Award className="w-5 h-5 mr-2" />
                                    Claim ₦40
                                  </>
                                )}
                              </Button>
                            </>
                          ) : (
                            <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border-2 border-green-200 dark:border-green-800">
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                                Earnings Claimed
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleSubscribe(channel.id)}
                          disabled={subscribeToChannel.isPending || channel.remainingBalance === 0}
                          className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white h-11 font-semibold disabled:opacity-50"
                        >
                          {subscribeToChannel.isPending ? (
                            "Processing..."
                          ) : channel.remainingBalance === 0 ? (
                            "No Slots Available"
                          ) : (
                            <>
                              <Youtube className="w-5 h-5 mr-2" />
                              Subscribe & Earn ₦40
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No Channels Available</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No channels match your search. Try a different keyword."
                    : "There are currently no verified channels accepting subscribers. Check back later!"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer - How It Works */}
        <div className="border-t-2 border-gray-200 dark:border-gray-700 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 flex-shrink-0">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-2">How to Earn</h4>
              <div className="grid md:grid-cols-3 gap-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <span>Click "Subscribe & Earn ₦40" on any channel</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>Visit the channel and subscribe on YouTube</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <span>Return here and click "Claim ₦40" to get paid</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
