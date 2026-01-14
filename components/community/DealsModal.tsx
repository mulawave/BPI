"use client";

import { useState } from "react";
import { FiX, FiTag, FiPercent, FiClock, FiCheck } from "react-icons/fi";
import { Tag, Gift, Star, Calendar, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface DealsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DealsModal({ isOpen, onClose }: DealsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'available' | 'claimed'>('available');
  const [confirmDealId, setConfirmDealId] = useState<string | null>(null);

  const { data: deals, refetch } = api.deals.getActiveDeals.useQuery({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });

  const { data: myDeals } = api.deals.getMyDeals.useQuery();

  const claimDealMutation = api.deals.claimDeal.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('Deal claimed successfully!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (!isOpen) return null;

  const categories = [
    { value: 'all', label: 'All Deals', icon: Tag },
    { value: 'package_discount', label: 'Package Discounts', icon: Gift },
    { value: 'referral_bonus', label: 'Referral Bonuses', icon: TrendingUp },
    { value: 'bundle', label: 'Bundles', icon: Star },
    { value: 'seasonal', label: 'Seasonal', icon: Calendar },
  ];

  const calculateDiscount = (deal: any) => {
    if (deal.discountType === 'percentage') {
      return `${deal.discountValue}% OFF`;
    }
    return `₦${deal.discountValue.toLocaleString()} OFF`;
  };

  const calculateFinalPrice = (deal: any) => {
    if (!deal.originalPrice) return null;
    if (deal.discountType === 'percentage') {
      return deal.originalPrice - (deal.originalPrice * deal.discountValue / 100);
    }
    return deal.originalPrice - deal.discountValue;
  };

  const getDaysRemaining = (endDate: Date) => {
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const handleClaimDeal = (dealId: string) => {
    setConfirmDealId(dealId);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <ConfirmDialog
        isOpen={!!confirmDealId}
        title="Claim this deal?"
        description="This will apply the deal to your account if eligible."
        confirmText={claimDealMutation.isPending ? "Claiming..." : "Yes, claim"}
        cancelText="Cancel"
        onClose={() => setConfirmDealId(null)}
        onConfirm={() => {
          if (!confirmDealId) return;
          claimDealMutation.mutate({ dealId: confirmDealId });
          setConfirmDealId(null);
        }}
      />

      <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-hidden bg-white dark:bg-bpi-dark-card rounded-2xl shadow-2xl m-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-red-600 to-red-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                <FiTag className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Best Deals</h2>
                <p className="text-orange-100 text-sm">Exclusive offers for BPI members</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <FiX className="w-7 h-7" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('available')}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg transition-all ${
                activeTab === 'available'
                  ? 'bg-white text-orange-600 shadow-lg font-semibold'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Tag className="w-5 h-5" />
              <span>Available Deals</span>
            </button>
            <button
              onClick={() => setActiveTab('claimed')}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg transition-all ${
                activeTab === 'claimed'
                  ? 'bg-white text-orange-600 shadow-lg font-semibold'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span>My Deals ({myDeals?.length || 0})</span>
            </button>
          </div>

          {/* Category Filter (only for available deals) */}
          {activeTab === 'available' && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setSelectedCategory(value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap text-sm ${
                    selectedCategory === value
                      ? 'bg-white text-orange-600 shadow-lg font-semibold'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-250px)] overflow-y-auto">
          {activeTab === 'available' ? (
            <div className="grid gap-4 md:grid-cols-2">
              {deals && deals.deals.length > 0 ? (
                deals.deals.map((deal: any) => {
                  const daysRemaining = getDaysRemaining(deal.endDate);
                  const finalPrice = calculateFinalPrice(deal);
                  const remainingClaims = deal.remainingClaims;

                  return (
                    <div
                      key={deal.id}
                      className={`bg-gradient-to-br from-white to-gray-50 dark:from-bpi-dark-card dark:to-bpi-dark-accent rounded-xl p-6 border-2 transition-all hover:shadow-lg ${
                        deal.isFeatured
                          ? 'border-orange-500 ring-2 ring-orange-500/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {deal.isFeatured && (
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold rounded-full mb-3">
                          <Star className="w-3 h-3" />
                          <span>Featured</span>
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-foreground mb-1">{deal.title}</h3>
                          <span className="inline-block px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 text-xs font-semibold rounded-full capitalize">
                            {deal.dealType.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                            {calculateDiscount(deal)}
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">{deal.description}</p>

                      {deal.originalPrice && finalPrice && (
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-2xl font-bold text-foreground">₦{finalPrice.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground line-through">₦{deal.originalPrice.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span>{daysRemaining} days left</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FiTag className="w-4 h-4 text-orange-500" />
                          <span>{remainingClaims} remaining</span>
                        </div>
                      </div>

                      {deal.requiresPackage && (
                        <div className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg mb-3">
                          Requires active package
                        </div>
                      )}

                      <button
                        onClick={() => handleClaimDeal(deal.id)}
                        disabled={remainingClaims === 0 || claimDealMutation.isPending}
                        className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {remainingClaims === 0 ? 'Sold Out' : 'Claim Deal'}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-20">
                  <Tag className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-muted-foreground">No deals available</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {myDeals && myDeals.length > 0 ? (
                myDeals.map((claim: any) => (
                  <div
                    key={claim.id}
                    className="bg-white dark:bg-bpi-dark-card rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FiCheck className="w-5 h-5 text-green-500" />
                          <h3 className="text-lg font-bold text-foreground">{claim.deal.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{claim.deal.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Claimed on {new Date(claim.claimedAt).toLocaleDateString()}</span>
                          <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 rounded">
                            {claim.deal.discountType === 'percentage' ? `${claim.deal.discountValue}% OFF` : `₦${claim.deal.discountValue.toLocaleString()} OFF`}
                          </span>
                        </div>
                      </div>
                      {claim.redeemedAt ? (
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 text-sm rounded-lg">
                          Redeemed
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 text-sm rounded-lg font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20">
                  <Gift className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-muted-foreground">No claimed deals yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
