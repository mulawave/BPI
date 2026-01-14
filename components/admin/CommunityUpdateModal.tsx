"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HiX, HiCalendar, HiSave } from "react-icons/hi";
import toast from "react-hot-toast";
import { api } from "../../client/trpc";

interface CommunityUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  update?: any; // Existing update for editing, or undefined for creation
  onSuccess: () => void;
}

export default function CommunityUpdateModal({
  isOpen,
  onClose,
  update,
  onSuccess,
}: CommunityUpdateModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "announcement",
    priority: "MEDIUM",
    imageUrl: "",
    ctaText: "",
    ctaLink: "",
    publishedAt: "",
    expiresAt: "",
    targetPackages: "",
    targetRanks: "",
    targetRegions: "",
  });

  // Reset form when modal opens or update changes
  useEffect(() => {
    if (update) {
      setFormData({
        title: update.title || "",
        content: update.content || "",
        category: update.category || "announcement",
        priority: update.priority || "MEDIUM",
        imageUrl: update.imageUrl || "",
        ctaText: update.ctaText || "",
        ctaLink: update.ctaLink || "",
        publishedAt: update.publishedAt ? new Date(update.publishedAt).toISOString().slice(0, 16) : "",
        expiresAt: update.expiresAt ? new Date(update.expiresAt).toISOString().slice(0, 16) : "",
        targetPackages: update.targetPackages || "",
        targetRanks: update.targetRanks || "",
        targetRegions: update.targetRegions || "",
      });
    } else {
      setFormData({
        title: "",
        content: "",
        category: "announcement",
        priority: "MEDIUM",
        imageUrl: "",
        ctaText: "",
        ctaLink: "",
        publishedAt: "",
        expiresAt: "",
        targetPackages: "",
        targetRanks: "",
        targetRegions: "",
      });
    }
  }, [update, isOpen]);

  const createMutation = api.admin.createCommunityUpdate.useMutation({
    onSuccess: () => {
      toast.success("Community update created successfully");
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to create update: ${error.message}`);
    },
  });

  const updateMutation = api.admin.updateCommunityUpdate.useMutation({
    onSuccess: () => {
      toast.success("Community update updated successfully");
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    if (update) {
      // Update existing
      updateMutation.mutate({
        updateId: update.id,
        data: {
          title: formData.title,
          content: formData.content,
          category: formData.category,
          priority: formData.priority,
          imageUrl: formData.imageUrl || undefined,
          ctaText: formData.ctaText || undefined,
          ctaLink: formData.ctaLink || undefined,
          expiresAt: formData.expiresAt || undefined,
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
              {update ? "Edit Community Update" : "Create Community Update"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Share announcements, news, and important updates with your community
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
              placeholder="Enter update title..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-white placeholder-gray-400"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter update content..."
              rows={6}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-white placeholder-gray-400 resize-none"
              required
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-white"
              >
                <option value="announcement">Announcement</option>
                <option value="news">News</option>
                <option value="event">Event</option>
                <option value="maintenance">Maintenance</option>
                <option value="important">Important</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Image URL (optional)
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>

          {/* Call to Action */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CTA Text (optional)
              </label>
              <input
                type="text"
                value={formData.ctaText}
                onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                placeholder="Learn More"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CTA Link (optional)
              </label>
              <input
                type="url"
                value={formData.ctaLink}
                onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Publishing Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Publish At (optional)
              </label>
              <div className="relative">
                <HiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="datetime-local"
                  value={formData.publishedAt}
                  onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-white"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty to publish immediately
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expires At (optional)
              </label>
              <div className="relative">
                <HiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-white"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Auto-hide after this date
              </p>
            </div>
          </div>

          {/* Targeting Options */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Targeting (optional)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Packages (comma-separated IDs)
                </label>
                <input
                  type="text"
                  value={formData.targetPackages}
                  onChange={(e) => setFormData({ ...formData, targetPackages: e.target.value })}
                  placeholder="e.g., pkg_001, pkg_002"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Ranks (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.targetRanks}
                  onChange={(e) => setFormData({ ...formData, targetRanks: e.target.value })}
                  placeholder="e.g., Diamond, Platinum"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Regions (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.targetRegions}
                  onChange={(e) => setFormData({ ...formData, targetRegions: e.target.value })}
                  placeholder="e.g., US, EU, ASIA"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-400 text-gray-900 dark:text-white placeholder-gray-400"
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
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-700 hover:to-green-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <HiSave className="w-5 h-5" />
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : update
                ? "Update"
                : "Create"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
