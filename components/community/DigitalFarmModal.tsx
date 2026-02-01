"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Leaf, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Sprout,
  Sun,
  Droplets,
  Package,
  BarChart3,
  History,
  Plus,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DigitalFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "my-plots" | "plant-new" | "marketplace" | "statistics";

export default function DigitalFarmModal({ isOpen, onClose }: DigitalFarmModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("my-plots");
  const [selectedCrop, setSelectedCrop] = useState<any>(null);
  const [plotName, setPlotName] = useState("");
  const [plotSize, setPlotSize] = useState<number>(1);
  const [investmentAmount, setInvestmentAmount] = useState<number>(0);

  // API Queries
  const { data: plots, refetch: refetchPlots } = api.digitalFarm.getMyPlots.useQuery(undefined, {
    enabled: isOpen,
  });
  const { data: crops } = api.digitalFarm.getCrops.useQuery(undefined, {
    enabled: isOpen,
  });
  const { data: stats } = api.digitalFarm.getMyStats.useQuery(undefined, {
    enabled: isOpen,
  });

  // Mutations
  const plantCropMutation = api.digitalFarm.plantCrop.useMutation({
    onSuccess: () => {
      toast.success("🌱 Crop planted successfully!");
      refetchPlots();
      setActiveTab("my-plots");
      setSelectedCrop(null);
      setPlotName("");
      setPlotSize(1);
      setInvestmentAmount(0);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const harvestMutation = api.digitalFarm.harvestPlot.useMutation({
    onSuccess: (data) => {
      toast.success(`🎉 Harvested! Earned ₦${data.actualRevenue.toLocaleString()}`);
      refetchPlots();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handlePlantCrop = () => {
    if (!selectedCrop || !plotName || plotSize <= 0 || investmentAmount <= 0) {
      toast.error("Please fill all fields");
      return;
    }

    plantCropMutation.mutate({
      cropType: selectedCrop.name,
      plotName,
      plotSize,
      investmentAmount,
    });
  };

  const handleHarvest = (plotId: string) => {
    harvestMutation.mutate({ plotId });
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "seeded":
        return <Sprout className="w-4 h-4" />;
      case "growing":
        return <Sun className="w-4 h-4" />;
      case "harvesting":
        return <Package className="w-4 h-4" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Leaf className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "vegetables":
        return "from-green-500 to-emerald-600";
      case "grains":
        return "from-yellow-500 to-orange-600";
      case "fruits":
        return "from-red-500 to-pink-600";
      case "livestock":
        return "from-purple-500 to-indigo-600";
      default:
        return "from-blue-500 to-cyan-600";
    }
  };

  const tabs = [
    { id: "my-plots" as TabType, label: "My Plots", icon: Leaf },
    { id: "plant-new" as TabType, label: "Plant New", icon: Plus },
    { id: "marketplace" as TabType, label: "Marketplace", icon: Package },
    { id: "statistics" as TabType, label: "Statistics", icon: BarChart3 },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full w-full flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-bpi-dark-card rounded-3xl shadow-2xl max-w-7xl w-full h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Leaf className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Digital Farm</h1>
                  <p className="text-green-100 text-sm">Grow crops virtually, earn real profits</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-lg transition-all whitespace-nowrap ${
                    activeTab === id
                      ? "bg-white text-green-600 shadow-lg font-semibold"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-bpi-dark">
            <div className="max-w-6xl mx-auto">
              {/* My Plots Tab */}
              {activeTab === "my-plots" && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Active Plots</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {stats.activePlots}
                            </p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Invested</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              ₦{stats.totalInvested.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Earned</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              ₦{stats.totalEarned.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Net Profit</p>
                            <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              ₦{stats.netProfit.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Plots List */}
                  {plots && plots.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {plots.map((plot: any) => (
                        <Card
                          key={plot.id}
                          className="overflow-hidden hover:shadow-xl transition-all group"
                        >
                          {/* Plot Image/Header */}
                          <div className={`h-32 bg-gradient-to-br ${getCategoryColor(plot.cropType)} relative`}>
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all" />
                            <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                              <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-800 flex items-center gap-1">
                                {getStageIcon(plot.stage)}
                                {plot.stage}
                              </span>
                              <span className={`px-3 py-1 backdrop-blur-sm rounded-full text-xs font-semibold ${
                                plot.status === 'active' 
                                  ? 'bg-green-500/90 text-white'
                                  : 'bg-gray-500/90 text-white'
                              }`}>
                                {plot.status}
                              </span>
                            </div>
                            <div className="absolute bottom-3 left-3 right-3">
                              <h3 className="text-white font-bold text-lg drop-shadow-lg">
                                {plot.plotName}
                              </h3>
                              <p className="text-white/90 text-sm drop-shadow-lg">
                                {plot.cropType} • {plot.plotSize} ha
                              </p>
                            </div>
                          </div>

                          {/* Plot Details */}
                          <div className="p-4 space-y-3">
                            {/* Progress Bar */}
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Growth Progress</span>
                                <span className="font-semibold">{plot.progress}%</span>
                              </div>
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all"
                                  style={{ width: `${plot.progress}%` }}
                                />
                              </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">Investment</p>
                                <p className="font-semibold">₦{plot.investmentAmount.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Est. Revenue</p>
                                <p className="font-semibold text-green-600">₦{plot.estimatedRevenue.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Days Left</p>
                                <p className="font-semibold flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {plot.daysRemaining}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Est. Yield</p>
                                <p className="font-semibold">{plot.estimatedYield.toFixed(1)} kg</p>
                              </div>
                            </div>

                            {/* Action Button */}
                            {plot.status === 'active' && plot.progress === 100 && (
                              <Button
                                onClick={() => handleHarvest(plot.id)}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                disabled={harvestMutation.isPending}
                              >
                                {harvestMutation.isPending ? "Harvesting..." : "🌾 Harvest Now"}
                              </Button>
                            )}

                            {plot.status === 'harvested' && (
                              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Harvested</p>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                  ₦{plot.actualRevenue?.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Profit: ₦{((plot.actualRevenue || 0) - plot.investmentAmount).toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-12 text-center">
                      <Leaf className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">No Plots Yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Start your digital farming journey by planting your first crop
                      </p>
                      <Button
                        onClick={() => setActiveTab("plant-new")}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Plant Your First Crop
                      </Button>
                    </Card>
                  )}
                </div>
              )}

              {/* Plant New Tab */}
              {activeTab === "plant-new" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Crop Selection */}
                  <div className="lg:col-span-2 space-y-4">
                    <Card className="p-6">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-600" />
                        Select a Crop
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {crops?.map((crop: any) => (
                          <div
                            key={crop.id}
                            onClick={() => setSelectedCrop(crop)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedCrop?.id === crop.id
                                ? "border-green-600 bg-green-50 dark:bg-green-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-green-400"
                            }`}
                          >
                            <div className={`w-full h-32 bg-gradient-to-br ${getCategoryColor(crop.category)} rounded-lg mb-3 flex items-center justify-center`}>
                              <Leaf className="w-12 h-12 text-white" />
                            </div>
                            <h4 className="font-semibold mb-1">{crop.name}</h4>
                            <p className="text-xs text-muted-foreground mb-2">{crop.description}</p>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{crop.growthDuration} days</span>
                              <span className="font-semibold text-green-600">
                                {crop.pricePerKg} ₦/kg
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Right: Plot Configuration */}
                  <div className="space-y-4">
                    <Card className="p-6">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Sprout className="w-5 h-5 text-green-600" />
                        Plot Details
                      </h3>

                      {selectedCrop ? (
                        <div className="space-y-4">
                          {/* Plot Name */}
                          <div>
                            <label className="block text-sm font-medium mb-2">Plot Name</label>
                            <input
                              type="text"
                              value={plotName}
                              onChange={(e) => setPlotName(e.target.value)}
                              placeholder="e.g., Farm A"
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800"
                            />
                          </div>

                          {/* Plot Size */}
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Plot Size (hectares)
                            </label>
                            <input
                              type="number"
                              value={plotSize}
                              onChange={(e) => setPlotSize(parseFloat(e.target.value))}
                              min="0.1"
                              max="100"
                              step="0.1"
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800"
                            />
                          </div>

                          {/* Investment Amount */}
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Investment Amount (₦)
                            </label>
                            <input
                              type="number"
                              value={investmentAmount}
                              onChange={(e) => setInvestmentAmount(parseFloat(e.target.value))}
                              min={selectedCrop.minInvestment}
                              max={selectedCrop.maxInvestment}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Min: ₦{selectedCrop.minInvestment.toLocaleString()} • Max: ₦{selectedCrop.maxInvestment.toLocaleString()}
                            </p>
                          </div>

                          {/* Estimates */}
                          {plotSize > 0 && (
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-2">
                              <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                                Estimates
                              </p>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Expected Yield</span>
                                <span className="font-medium">
                                  {(plotSize * selectedCrop.yieldPerHectare).toFixed(2)} kg
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Est. Revenue</span>
                                <span className="font-medium text-green-600">
                                  ₦{(plotSize * selectedCrop.yieldPerHectare * selectedCrop.pricePerKg).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Growth Duration</span>
                                <span className="font-medium">{selectedCrop.growthDuration} days</span>
                              </div>
                            </div>
                          )}

                          {/* Plant Button */}
                          <Button
                            onClick={handlePlantCrop}
                            disabled={plantCropMutation.isPending || !plotName || !plotSize || !investmentAmount}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          >
                            {plantCropMutation.isPending ? "Planting..." : "🌱 Plant Crop"}
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                          <p className="text-muted-foreground">
                            Select a crop to start planning your plot
                          </p>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              )}

              {/* Marketplace Tab */}
              {activeTab === "marketplace" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {crops?.map((crop: any) => (
                    <Card key={crop.id} className="overflow-hidden hover:shadow-xl transition-all">
                      <div className={`h-48 bg-gradient-to-br ${getCategoryColor(crop.category)} relative`}>
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Leaf className="w-20 h-20 text-white opacity-80" />
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-800">
                            {crop.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2">{crop.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{crop.description}</p>

                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Growth Time</p>
                            <p className="font-semibold">{crop.growthDuration} days</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Price/kg</p>
                            <p className="font-semibold text-green-600">₦{crop.pricePerKg}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Min Investment</p>
                            <p className="font-semibold">₦{crop.minInvestment.toLocaleString()}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Yield/ha</p>
                            <p className="font-semibold">{crop.yieldPerHectare} kg</p>
                          </div>
                        </div>

                        <Button
                          onClick={() => {
                            setSelectedCrop(crop);
                            setActiveTab("plant-new");
                          }}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
                        >
                          Plant This Crop
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Statistics Tab */}
              {activeTab === "statistics" && stats && (
                <div className="space-y-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                      <div className="flex items-center justify-between mb-3">
                        <Leaf className="w-8 h-8 opacity-80" />
                      </div>
                      <p className="text-sm opacity-90 mb-1">Total Plots</p>
                      <p className="text-3xl font-bold">{stats.totalPlots}</p>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                      <div className="flex items-center justify-between mb-3">
                        <DollarSign className="w-8 h-8 opacity-80" />
                      </div>
                      <p className="text-sm opacity-90 mb-1">Total Invested</p>
                      <p className="text-3xl font-bold">₦{stats.totalInvested.toLocaleString()}</p>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                      <div className="flex items-center justify-between mb-3">
                        <TrendingUp className="w-8 h-8 opacity-80" />
                      </div>
                      <p className="text-sm opacity-90 mb-1">Total Earned</p>
                      <p className="text-3xl font-bold">₦{stats.totalEarned.toLocaleString()}</p>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-orange-500 to-yellow-600 text-white">
                      <div className="flex items-center justify-between mb-3">
                        <BarChart3 className="w-8 h-8 opacity-80" />
                      </div>
                      <p className="text-sm opacity-90 mb-1">ROI</p>
                      <p className="text-3xl font-bold">{stats.roi.toFixed(1)}%</p>
                    </Card>
                  </div>

                  {/* Detailed Stats */}
                  <Card className="p-6">
                    <h3 className="text-xl font-bold mb-6">Performance Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-muted-foreground">Active Plots</span>
                          <span className="text-2xl font-bold text-green-600">{stats.activePlots}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-muted-foreground">Harvested Plots</span>
                          <span className="text-2xl font-bold text-blue-600">{stats.harvestedPlots}</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-muted-foreground">Net Profit</span>
                          <span className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₦{stats.netProfit.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-muted-foreground">Success Rate</span>
                          <span className="text-2xl font-bold text-purple-600">
                            {stats.totalPlots > 0 ? ((stats.harvestedPlots / stats.totalPlots) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
