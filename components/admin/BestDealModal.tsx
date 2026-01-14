"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HiX, HiCalendar, HiSave, HiTag } from "react-icons/hi";
import toast from "react-hot-toast";
import { api } from "../../client/trpc";

interface BestDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal?: any; // Existing deal for editing, or undefined for creation
  onSuccess: () => void;
}

export default function BestDealModal({
  isOpen,
  onClose,
  deal,
  onSuccess,
}: BestDealModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dealType: "product",
    discountType: "PERCENTAGE",
    discountValue: 0,
    originalPrice: 0,
    discountedPrice: 0,
    startDate: "",
    endDate: "",
    usageLimit: 0,
    usagePerUser: 1,
    eligiblePackages: "",
    eligibleRanks: "",
    minPurchaseAmount: 0,
    isFeatured: false,
    imageUrl: "",
    ctaText: "",
  });

  // Reset form when modal opens or deal changes
  useEffect(() => {
    if (deal) {
      setFormData({
        title: deal.title || "",
        description: deal.description || "",
        dealType: deal.dealType || "product",
        discountType: deal.discountType || "PERCENTAGE",
        discountValue: deal.discountValue || 0,
        originalPrice: deal.originalPrice || 0,
        discountedPrice: deal.discountedPrice || 0,
        startDate: deal.startDate ? new Date(deal.startDate).toISOString().slice(0, 16) : "",
        endDate: deal.endDate ? new Date(deal.endDate).toISOString().slice(0, 16) : "",
        usageLimit: deal.usageLimit || 0,
        usagePerUser: deal.usagePerUser || 1,
        eligiblePackages: deal.eligiblePackages || "",
        eligibleRanks: deal.eligibleRanks || "",
        minPurchaseAmount: deal.minPurchaseAmount || 0,
        isFeatured: deal.isFeatured || false,
        imageUrl: deal.imageUrl || "",
        ctaText: deal.ctaText || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        dealType: "product",
        discountType: "PERCENTAGE",
        discountValue: 0,
        originalPrice: 0,
        discountedPrice: 0,
        startDate: "",
        endDate: "",
        usageLimit: 0,
        usagePerUser: 1,
        eligiblePackages: "",
        eligibleRanks: "",
        minPurchaseAmount: 0,
        isFeatured: false,
        imageUrl: "",
        ctaText: "",
      });
    }
  }, [deal, isOpen]);

  const createMutation = api.admin.createBestDeal.useMutation({
    onSuccess: () => {
      toast.success("Best deal created successfully");
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to create deal: ${error.message}`);
    },
  });

  const updateMutation = api.admin.updateBestDeal.useMutation({
    onSuccess: () => {
      toast.success("Deal updated successfully");
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to update deal: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error("Start date and end date are required");
      return;
    }

    if (deal) {
      // Update existing
      updateMutation.mutate({
        dealId: deal.id,
        data: {
          title: formData.title,
          description: formData.description,
          isFeatured: formData.isFeatured,
          discountValue: formData.discountValue,
          usageLimit: formData.usageLimit || undefined,
        },
      });
    } else {
      // Create new
      createMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {deal ? "Edit Best Deal" : "Create Best Deal"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Create attractive deals and discounts for your community
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <HiX className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter deal title..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-gray-900 dark:text-white placeholder-gray-400"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter deal description..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-gray-900 dark:text-white placeholder-gray-400 resize-none"
              required
            />
          </div>

          {/* Deal Type and Discount Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deal Type
              </label>
              <select
                value={formData.dealType}
                onChange={(e) => setFormData({ ...formData, dealType: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-gray-900 dark:text-white"
              >
                <option value="product">Product</option>
                <option value="service">Service</option>
                <option value="membership">Membership</option>
                <option value="bundle">Bundle</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discount Type
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-gray-900 dark:text-white"
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discount Value *
              </label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                placeholder="20"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-gray-900 dark:text-white placeholder-gray-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Original Price
              </label>
              <input
                type="number"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) })}
                placeholder="100.00"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discounted Price
              </label>
              <input
                type="number"
                value={formData.discountedPrice}
                onChange={(e) => setFormData({ ...formData, discountedPrice: parseFloat(e.target.value) })}
                placeholder="80.00"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date *
              </label>
              <div className="relative">
                <HiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date *
              </label>
              <div className="relative">
                <HiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Usage Limit
              </label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) })}
                placeholder="100"
                min="0"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Usage Per User
              </label>
              <input
                type="number"
                value={formData.usagePerUser}
                onChange={(e) => setFormData({ ...formData, usagePerUser: parseInt(e.target.value) })}
                placeholder="1"
                min="1"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Image and CTA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CTA Text
              </label>
              <input
                type="text"
                value={formData.ctaText}
                onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                placeholder="Claim Deal"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <input
              type="checkbox"
              id="isFeatured"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
            />
            <label htmlFor="isFeatured" className="flex items-center gap-2 cursor-pointer">
              <HiTag className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Feature this deal (appears prominently)
              </span>
            </label>
          </div>

          {/* Eligibility Options */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Eligibility (optional)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Eligible Packages (comma-separated IDs)
                </label>
                <input
                  type="text"
                  value={formData.eligiblePackages}
                  onChange={(e) => setFormData({ ...formData, eligiblePackages: e.target.value })}
                  placeholder="e.g., pkg_001, pkg_002"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Eligible Ranks (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.eligibleRanks}
                  onChange={(e) => setFormData({ ...formData, eligibleRanks: e.target.value })}
                  placeholder="e.g., Diamond, Platinum"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Purchase Amount
                </label>
                <input
                  type="number"
                  value={formData.minPurchaseAmount}
                  onChange={(e) => setFormData({ ...formData, minPurchaseAmount: parseFloat(e.target.value) })}
                  placeholder="50.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <HiSave className="w-5 h-5" />
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : deal
                ? "Update Deal"
                : "Create Deal"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
