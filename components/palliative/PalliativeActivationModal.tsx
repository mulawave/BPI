"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { api } from "@/client/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";
import { 
  Car, Home, MapPin, Briefcase, Sun as SolarIcon, GraduationCap,
  Loader2, CheckCircle2, Sparkles, Target, X
} from "lucide-react";
import { cn } from "@/styles/utils";
import toast from "react-hot-toast";

interface PalliativeActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onSuccess?: () => void;
}

interface PalliativeOption {
  name: string;
  slug: string;
  targetAmount: number;
  description: string | null;
  icon: string | null;
  displayOrder: number;
}

/**
 * PalliativeActivationModal - Selection interface when ₦200k threshold reached
 * Allows lower-tier users to choose their palliative type and activate
 */
export function PalliativeActivationModal({
  isOpen,
  onClose,
  currentBalance,
  onSuccess,
}: PalliativeActivationModalProps) {
  const { formatAmount } = useCurrency();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  
  const { data: options, isLoading: loadingOptions } = api.palliative.getPalliativeOptions.useQuery();
  const activateMutation = api.palliative.activatePalliative.useMutation({
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  const palliativeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    car: Car,
    home: Home,
    house: Home,
    map: MapPin,
    land: MapPin,
    briefcase: Briefcase,
    business: Briefcase,
    sun: SolarIcon,
    solar: SolarIcon,
    "graduation-cap": GraduationCap,
    education: GraduationCap,
  };

  const handleActivate = async () => {
    if (!selectedSlug) return;
    
    try {
      await activateMutation.mutateAsync({ palliativeType: selectedSlug as any });
    } catch (error) {
      console.error("Activation failed:", error);
      toast.error("Failed to activate palliative. Please try again.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              Activate Your Palliative
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Choose your palliative type to start earning towards your goal
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Balance Display */}
        <div className="mb-6 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">
                Your Pooled Balance
              </p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {formatAmount(currentBalance)}
              </p>
            </div>
            <div className="text-right">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Threshold Reached
              </p>
            </div>
          </div>
        </div>

        {/* Options Grid */}
        {loadingOptions ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {options?.map((option) => {
                const IconComponent = palliativeIcons[option.icon || ""] || Target;
                const isSelected = selectedSlug === option.slug;
                
                return (
                  <button
                    key={option.slug}
                    onClick={() => setSelectedSlug(option.slug)}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all text-left hover:scale-[1.02]",
                      isSelected
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 shadow-lg"
                        : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2.5 rounded-lg flex-shrink-0",
                        isSelected
                          ? "bg-purple-600 dark:bg-purple-500"
                          : "bg-gray-100 dark:bg-gray-800"
                      )}>
                        <IconComponent className={cn(
                          "w-5 h-5",
                          isSelected
                            ? "text-white"
                            : "text-gray-600 dark:text-gray-400"
                        )} />
                      </div>
                      <div className="flex-1">
                        <h3 className={cn(
                          "font-semibold mb-1",
                          isSelected
                            ? "text-purple-900 dark:text-purple-100"
                            : "text-gray-900 dark:text-gray-100"
                        )}>
                          {option.name}
                        </h3>
                        <p className={cn(
                          "text-xs mb-2",
                          isSelected
                            ? "text-purple-700 dark:text-purple-300"
                            : "text-gray-600 dark:text-gray-400"
                        )}>
                          {option.description || "No description available"}
                        </p>
                        <p className={cn(
                          "text-sm font-bold",
                          isSelected
                            ? "text-purple-600 dark:text-purple-400"
                            : "text-gray-700 dark:text-gray-300"
                        )}>
                          Target: {formatAmount(option.targetAmount)}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Info Box */}
            <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                What happens after activation:
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Your ₦{formatAmount(currentBalance)} pooled balance transfers to your selected palliative wallet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Future palliative rewards (10% of referrals) go directly to your selected wallet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Track your progress towards the target amount on your dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Once you reach the target, submit a maturity claim for processing</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={activateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold"
                onClick={handleActivate}
                disabled={!selectedSlug || activateMutation.isPending}
              >
                {activateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Activate Palliative
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
