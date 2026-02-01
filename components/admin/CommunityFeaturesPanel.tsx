"use client";

import { useState } from "react";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import { 
  Calculator, 
  Leaf, 
  GraduationCap, 
  Download, 
  Megaphone, 
  CheckCircle2, 
  XCircle 
} from "lucide-react";
import { HiSave } from "react-icons/hi";

export default function CommunityFeaturesPanel() {
  const utils = api.useUtils();
  
  const { data: settings, isLoading } = api.admin.getSettings.useQuery();
  const updateMutation = api.admin.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Feature toggles updated successfully");
      utils.admin.getSettings.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update feature toggles");
    },
  });

  const [localSettings, setLocalSettings] = useState({
    enableBpiCalculator: settings?.enableBpiCalculator ?? true,
    enableDigitalFarm: settings?.enableDigitalFarm ?? false,
    enableTrainingCenter: settings?.enableTrainingCenter ?? true,
    enablePromotionalMaterials: settings?.enablePromotionalMaterials ?? true,
    enableLatestUpdates: settings?.enableLatestUpdates ?? true,
  });

  // Update local state when settings load
  if (settings && !isLoading) {
    if (
      localSettings.enableBpiCalculator !== settings.enableBpiCalculator ||
      localSettings.enableDigitalFarm !== settings.enableDigitalFarm ||
      localSettings.enableTrainingCenter !== settings.enableTrainingCenter ||
      localSettings.enablePromotionalMaterials !== settings.enablePromotionalMaterials ||
      localSettings.enableLatestUpdates !== settings.enableLatestUpdates
    ) {
      setLocalSettings({
        enableBpiCalculator: settings.enableBpiCalculator ?? true,
        enableDigitalFarm: settings.enableDigitalFarm ?? false,
        enableTrainingCenter: settings.enableTrainingCenter ?? true,
        enablePromotionalMaterials: settings.enablePromotionalMaterials ?? true,
        enableLatestUpdates: settings.enableLatestUpdates ?? true,
      });
    }
  }

  const handleToggle = (key: keyof typeof localSettings) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    updateMutation.mutate(localSettings);
  };

  const features = [
    {
      key: "enableBpiCalculator" as const,
      name: "BPI Calculator",
      description: "Allows users to calculate potential earnings",
      icon: Calculator,
      color: "blue",
    },
    {
      key: "enableDigitalFarm" as const,
      name: "Digital Farm",
      description: "Virtual agriculture investment platform",
      icon: Leaf,
      color: "green",
    },
    {
      key: "enableTrainingCenter" as const,
      name: "Training Center",
      description: "Skill development courses and certifications",
      icon: GraduationCap,
      color: "purple",
    },
    {
      key: "enablePromotionalMaterials" as const,
      name: "Promotional Materials",
      description: "Marketing assets library for users",
      icon: Download,
      color: "indigo",
    },
    {
      key: "enableLatestUpdates" as const,
      name: "Latest Updates",
      description: "Company news and announcements feed",
      icon: Megaphone,
      color: "orange",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Community Feature Toggles
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Enable or disable community features visible on user dashboards
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
        >
          <HiSave className="w-5 h-5" />
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          const isEnabled = localSettings[feature.key];
          
          return (
            <div
              key={feature.key}
              className={`p-4 rounded-xl border-2 transition-all ${
                isEnabled
                  ? `border-${feature.color}-500 bg-${feature.color}-50 dark:bg-${feature.color}-900/20`
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isEnabled
                    ? `bg-${feature.color}-500/20`
                    : "bg-gray-200 dark:bg-gray-700"
                }`}>
                  <Icon className={`w-5 h-5 ${
                    isEnabled
                      ? `text-${feature.color}-600 dark:text-${feature.color}-400`
                      : "text-gray-500"
                  }`} />
                </div>
                <button
                  onClick={() => handleToggle(feature.key)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  style={{
                    backgroundColor: isEnabled ? '#10b981' : '#9ca3af'
                  }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {feature.name}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                {feature.description}
              </p>

              <div className="flex items-center gap-1.5">
                {isEnabled ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      Enabled
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-500">
                      Disabled
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> Changes take effect immediately for all users. Disabled features will be hidden from user dashboards.
        </p>
      </div>
    </div>
  );
}
