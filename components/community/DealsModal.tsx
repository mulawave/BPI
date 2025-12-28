"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/client/trpc";
import { Modal } from "@/components/ui/Modal";
import { 
  Sparkles, Clock, Tag, Package, Users, CheckCircle, X, 
  AlertCircle, Info, TrendingUp 
} from "lucide-react";

interface DealsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DealsModal({ isOpen, onClose }: DealsModalProps) {
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [showMyClaims, setShowMyClaims] = useState(false);

  const { data: activeDeals, isLoading } = trpc.deals.getActiveDeals.useQuery();
  const { data: myClaims } = trpc.deals.getMyClaims.useQuery(undefined, {
    enabled: showMyClaims,
  });
  const claimDealMutation = trpc.deals.claimDeal.useMutation();
  const checkEligibilityQuery = trpc.deals.checkEligibility.useQuery(
    { dealId: selectedDeal?.id || "" },
    { enabled: !!selectedDeal }
  );

  const handleClaimDeal = async (dealId: string) => {
    try {
      await claimDealMutation.mutateAsync({ dealId });
      alert("Deal claimed successfully! Check your email for details.");
      setSelectedDeal(null);
    } catch (error: any) {
      alert(error.message || "Failed to claim deal");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const calculateTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const getDealTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      package_discount: "bg-blue-100 text-blue-800 border-blue-300",
      referral_bonus: "bg-green-100 text-green-800 border-green-300",
      bundle: "bg-purple-100 text-purple-800 border-purple-300",
      loyalty: "bg-orange-100 text-orange-800 border-orange-300",
      seasonal: "bg-pink-100 text-pink-800 border-pink-300",
    };
    return colors[type] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-full">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Best Deals</h2>
              <p className="text-pink-100 text-sm">
                Exclusive offers and promotions for BPI members
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-4 border-b">
          <button
            onClick={() => setShowMyClaims(false)}
            className={`px-4 py-2 font-medium transition-colors ${
              !showMyClaims
                ? "text-pink-600 border-b-2 border-pink-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            Active Deals ({activeDeals?.length || 0})
          </button>
          <button
            onClick={() => setShowMyClaims(true)}
            className={`px-4 py-2 font-medium transition-colors ${
              showMyClaims
                ? "text-pink-600 border-b-2 border-pink-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            My Claims ({myClaims?.length || 0})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showMyClaims ? (
            /* Active Deals View */
            isLoading ? (
              <div className="text-center py-12 text-gray-400">Loading deals...</div>
            ) : activeDeals && activeDeals.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {activeDeals.map((deal: any) => {
                  const timeRemaining = calculateTimeRemaining(deal.endDate);
                  const isExpiringSoon = deal.expiresInHours && deal.expiresInHours < 24;
                  const discountAmount = deal.discountType === "PERCENTAGE"
                    ? `${deal.discountValue}% OFF`
                    : formatCurrency(deal.discountValue);

                  return (
                    <div
                      key={deal.id}
                      className={`border rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${
                        deal.isFeatured ? "border-pink-500 ring-2 ring-pink-200" : "border-gray-200"
                      }`}
                    >
                      {/* Deal Image */}
                      {deal.imageUrl && (
                        <div className="h-40 bg-gradient-to-br from-pink-100 to-rose-100 relative overflow-hidden">
                          <img
                            src={deal.imageUrl}
                            alt={deal.title}
                            className="w-full h-full object-cover"
                          />
                          {deal.isFeatured && (
                            <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              FEATURED
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-4">
                        {/* Deal Type Badge */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getDealTypeColor(deal.type)}`}>
                            {deal.type.replace(/_/g, " ").toUpperCase()}
                          </span>
                          {isExpiringSoon && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expiring Soon
                            </span>
                          )}
                        </div>

                        {/* Deal Title */}
                        <h3 className="font-bold text-lg text-gray-800 mb-2">{deal.title}</h3>

                        {/* Discount Badge */}
                        <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg p-3 mb-3 text-center">
                          <div className="text-3xl font-bold">{discountAmount}</div>
                          {deal.originalPrice && deal.discountedPrice && (
                            <div className="text-sm mt-1">
                              <span className="line-through opacity-75">{formatCurrency(deal.originalPrice)}</span>
                              {" → "}
                              <span className="font-bold">{formatCurrency(deal.discountedPrice)}</span>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-3">{deal.description}</p>

                        {/* Deal Info */}
                        <div className="space-y-2 text-xs text-gray-500 mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className={isExpiringSoon ? "text-red-600 font-semibold" : ""}>
                              {timeRemaining}
                            </span>
                          </div>
                          {deal.usageLimit && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>
                                {deal.currentUsage || 0} of {deal.usageLimit} claimed
                              </span>
                            </div>
                          )}
                          {deal.usagePerUser && (
                            <div className="flex items-center gap-2">
                              <Tag className="w-4 h-4" />
                              <span>Limit {deal.usagePerUser} per user</span>
                            </div>
                          )}
                        </div>

                        {/* Eligibility Badge */}
                        {deal.isEligible === false && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3 text-xs text-yellow-800 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold">Not Eligible</p>
                              <p className="text-yellow-600">
                                {deal.eligibilityMessage || "Check requirements"}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <button
                          onClick={() => setSelectedDeal(deal)}
                          disabled={deal.isEligible === false || !deal.isAvailable}
                          className={`w-full py-2 rounded-lg font-semibold transition-all ${
                            deal.isEligible === false || !deal.isAvailable
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg"
                          }`}
                        >
                          {deal.isAvailable ? "View Details & Claim" : "Deal Unavailable"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No active deals at the moment</p>
                <p className="text-xs">Check back soon for exclusive offers!</p>
              </div>
            )
          ) : (
            /* My Claims View */
            myClaims && myClaims.length > 0 ? (
              <div className="space-y-3">
                {myClaims.map((claim: any) => (
                  <div
                    key={claim.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-pink-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800">{claim.dealTitle}</h4>
                        <p className="text-xs text-gray-500">
                          Claimed on {new Date(claim.claimedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        claim.used
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {claim.used ? "Used" : "Available"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Discount</p>
                        <p className="font-semibold text-pink-600">
                          {claim.discountType === "PERCENTAGE"
                            ? `${claim.discountValue}%`
                            : formatCurrency(claim.discountValue)}
                        </p>
                      </div>
                      {claim.used && (
                        <div>
                          <p className="text-gray-500 text-xs">Used On</p>
                          <p className="font-semibold">
                            {new Date(claim.usedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {claim.expiresAt && (
                        <div>
                          <p className="text-gray-500 text-xs">Expires</p>
                          <p className="font-semibold">
                            {new Date(claim.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No claimed deals yet</p>
                <p className="text-xs">Browse active deals to get started</p>
              </div>
            )
          )}
        </div>

        {/* Deal Detail Modal (nested) */}
        {selectedDeal && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h3 className="font-bold text-lg">{selectedDeal.title}</h3>
                <button
                  onClick={() => setSelectedDeal(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {/* Deal Image */}
                {selectedDeal.imageUrl && (
                  <img
                    src={selectedDeal.imageUrl}
                    alt={selectedDeal.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}

                {/* Discount Display */}
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg p-4 mb-4 text-center">
                  <div className="text-4xl font-bold mb-1">
                    {selectedDeal.discountType === "PERCENTAGE"
                      ? `${selectedDeal.discountValue}% OFF`
                      : formatCurrency(selectedDeal.discountValue)}
                  </div>
                  {selectedDeal.originalPrice && selectedDeal.discountedPrice && (
                    <div className="text-sm">
                      <span className="line-through opacity-75">{formatCurrency(selectedDeal.originalPrice)}</span>
                      {" → "}
                      <span className="font-bold">{formatCurrency(selectedDeal.discountedPrice)}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedDeal.description}</p>
                </div>

                {/* Terms & Conditions */}
                {selectedDeal.termsAndConditions && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Terms & Conditions</h4>
                    <div
                      className="text-xs text-gray-600 prose prose-sm"
                      dangerouslySetInnerHTML={{ __html: selectedDeal.termsAndConditions }}
                    />
                  </div>
                )}

                {/* Eligibility Check */}
                {checkEligibilityQuery.data && (
                  <div className="mb-4">
                    {checkEligibilityQuery.data.eligible ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-800 font-medium">
                          You are eligible for this deal!
                        </span>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <span className="text-sm text-red-800 font-medium">
                            Not eligible for this deal
                          </span>
                        </div>
                        <ul className="text-xs text-red-700 space-y-1 ml-7">
                          {checkEligibilityQuery.data.reasons.map((reason: string, idx: number) => (
                            <li key={idx}>• {reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Claim Button */}
                <button
                  onClick={() => handleClaimDeal(selectedDeal.id)}
                  disabled={
                    claimDealMutation.isPending ||
                    !checkEligibilityQuery.data?.eligible
                  }
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    !checkEligibilityQuery.data?.eligible
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg"
                  }`}
                >
                  {claimDealMutation.isPending ? "Claiming..." : "Claim This Deal"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
