"use client";

import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { HiCalculator } from "react-icons/hi";
import { api } from "@/client/trpc";
import { TrendingUp, Users, DollarSign, Target, RotateCcw, History, Calculator } from "lucide-react";

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CalculationHistory {
  id: string;
  timestamp: Date;
  packageName: string;
  packagePrice: number;
  personalInvites: number;
  totalEarnings: number;
  totalReferrals: number;
}

export default function CalculatorModal({ isOpen, onClose }: CalculatorModalProps) {
  const { data: packages, isLoading } = api.package.getPackages.useQuery();
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [personalInvites, setPersonalInvites] = useState<number>(10);
  const [activeTab, setActiveTab] = useState<'calculator' | 'history'>('calculator');
  const [calculationHistory, setCalculationHistory] = useState<CalculationHistory[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('bpi-calculator-history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setCalculationHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (e) {
        console.error('Failed to load calculator history:', e);
      }
    }
  }, []);

  // Save calculation to history
  const saveToHistory = (results: any) => {
    if (!results) return;
    
    const newEntry: CalculationHistory = {
      id: Date.now().toString(),
      timestamp: new Date(),
      packageName: results.package.name,
      packagePrice: results.package.price,
      personalInvites: personalInvites,
      totalEarnings: results.totals.grand,
      totalReferrals: results.totals.referrals,
    };

    const updatedHistory = [newEntry, ...calculationHistory].slice(0, 10); // Keep last 10
    setCalculationHistory(updatedHistory);
    localStorage.setItem('bpi-calculator-history', JSON.stringify(updatedHistory));
  };

  // Reset form
  const handleReset = () => {
    setSelectedPackageId('');
    setPersonalInvites(10);
  };

  // Clear history
  const clearHistory = () => {
    setCalculationHistory([]);
    localStorage.removeItem('bpi-calculator-history');
  };

  // Calculate earnings breakdown
  const calculateEarnings = () => {
    if (!selectedPackageId || !packages) return null;

    const pkg = packages.find(p => p.id === selectedPackageId);
    if (!pkg) return null;

    // Level calculations
    const level1Count = personalInvites;
    const level2Count = level1Count * 10;
    const level3Count = level2Count * 10;
    const level4Count = level3Count * 10;

    // Calculate rewards per level
    const level1Earnings = {
      count: level1Count,
      cash: (pkg.cash_l1 || 0) * level1Count,
      palliative: (pkg.palliative_l1 || 0) * level1Count,
      bpt: (pkg.bpt_l1 || 0) * level1Count,
      cashback: (pkg.cashback_l1 || 0) * level1Count,
    };

    const level2Earnings = {
      count: level2Count,
      cash: (pkg.cash_l2 || 0) * level2Count,
      palliative: (pkg.palliative_l2 || 0) * level2Count,
      bpt: (pkg.bpt_l2 || 0) * level2Count,
      cashback: (pkg.cashback_l2 || 0) * level2Count,
    };

    const level3Earnings = {
      count: level3Count,
      cash: (pkg.cash_l3 || 0) * level3Count,
      palliative: (pkg.palliative_l3 || 0) * level3Count,
      bpt: (pkg.bpt_l3 || 0) * level3Count,
      cashback: (pkg.cashback_l3 || 0) * level3Count,
    };

    const level4Earnings = {
      count: level4Count,
      cash: (pkg.cash_l4 || 0) * level4Count,
      palliative: (pkg.palliative_l4 || 0) * level4Count,
      bpt: (pkg.bpt_l4 || 0) * level4Count,
      cashback: (pkg.cashback_l4 || 0) * level4Count,
    };

    // Total earnings across all levels
    const totalCash = level1Earnings.cash + level2Earnings.cash + level3Earnings.cash + level4Earnings.cash;
    const totalPalliative = level1Earnings.palliative + level2Earnings.palliative + level3Earnings.palliative + level4Earnings.palliative;
    const totalBpt = level1Earnings.bpt + level2Earnings.bpt + level3Earnings.bpt + level4Earnings.bpt;
    const totalCashback = level1Earnings.cashback + level2Earnings.cashback + level3Earnings.cashback + level4Earnings.cashback;
    
    const grandTotal = totalCash + totalPalliative + totalBpt + totalCashback;
    const totalReferrals = level1Count + level2Count + level3Count + level4Count;

    return {
      package: pkg,
      levels: [level1Earnings, level2Earnings, level3Earnings, level4Earnings],
      totals: {
        cash: totalCash,
        palliative: totalPalliative,
        bpt: totalBpt,
        cashback: totalCashback,
        grand: grandTotal,
        referrals: totalReferrals,
      }
    };
  };

  const results = calculateEarnings();

  // Auto-save to history when results change
  useEffect(() => {
    if (results && selectedPackageId && personalInvites > 0) {
      // Debounce saving to avoid too many saves
      const timer = setTimeout(() => {
        saveToHistory(results);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [results?.totals.grand, selectedPackageId, personalInvites]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Increased width to max-w-7xl */}
      <div className="relative z-10 w-full max-w-7xl max-h-[90vh] overflow-y-auto bg-white dark:bg-bpi-dark-card rounded-2xl shadow-2xl m-4">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <HiCalculator className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">BPI Earnings Calculator</h2>
                <p className="text-blue-50 text-sm">Calculate your 12-month earnings projection</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'calculator'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span className="font-medium">Calculator</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'history'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="font-medium">History</span>
              {calculationHistory.length > 0 && (
                <span className="bg-white/30 px-2 py-0.5 rounded-full text-xs">
                  {calculationHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'calculator' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Input Form */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-bpi-primary" />
                    Calculation Parameters
                  </h3>

                  <div className="space-y-4">
                    {/* Package Selection */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Select Membership Package
                      </label>
                      {isLoading ? (
                        <div className="w-full p-3 border border-bpi-border dark:border-bpi-dark-accent rounded-lg bg-background">
                          <span className="text-sm text-muted-foreground">Loading packages...</span>
                        </div>
                      ) : (
                        <select
                          value={selectedPackageId}
                          onChange={(e) => setSelectedPackageId(e.target.value)}
                          className="w-full p-3 border border-bpi-border dark:border-bpi-dark-accent rounded-lg bg-background text-foreground focus:border-bpi-primary focus:outline-none"
                        >
                          <option value="">-- Choose a package --</option>
                          {packages?.map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.name} - ₦{pkg.price.toLocaleString()}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Personal Invites Input */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Personal Invites (Level 1)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={personalInvites}
                        onChange={(e) => setPersonalInvites(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full p-3 border border-bpi-border dark:border-bpi-dark-accent rounded-lg bg-background text-foreground focus:border-bpi-primary focus:outline-none"
                        placeholder="Enter number of invites"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Each person invites 10 others at subsequent levels
                      </p>
                    </div>

                    {/* Reset Button */}
                    <button
                      onClick={handleReset}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset Form
                    </button>
                  </div>
                </div>

                {/* Summary Cards (moved here) */}
                {results && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg p-4 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4" />
                        <span className="text-xs font-medium">Total Referrals</span>
                      </div>
                      <p className="text-2xl font-bold">{results.totals.referrals.toLocaleString()}</p>
                      <p className="text-xs opacity-80 mt-1">Across 4 levels</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-4 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xs font-medium">Total Earnings</span>
                      </div>
                      <p className="text-2xl font-bold">₦{results.totals.grand.toLocaleString()}</p>
                      <p className="text-xs opacity-80 mt-1">12-month projection</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Results */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-bpi-primary" />
                  Earnings Projection
                </h3>

                {results ? (
                  <div className="space-y-4">
                    {/* Level-by-Level Breakdown */}
                    <div className="bg-gray-50 dark:bg-bpi-dark-accent rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-3 text-sm">
                        Breakdown by Level
                      </h4>
                      
                      <div className="space-y-3">
                        {results.levels.map((level, idx) => {
                          const levelNum = idx + 1;
                          const levelTotal = level.cash + level.palliative + level.bpt + level.cashback;
                          
                          return (
                            <div key={levelNum} className="bg-white dark:bg-bpi-dark-card rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-foreground text-sm">Level {levelNum}</span>
                                <span className="text-xs text-muted-foreground">{level.count.toLocaleString()} referrals</span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {level.cash > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Cash:</span>
                                    <span className="font-medium text-emerald-600 dark:text-emerald-400">₦{level.cash.toLocaleString()}</span>
                                  </div>
                                )}
                                {level.palliative > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Palliative:</span>
                                    <span className="font-medium text-blue-600 dark:text-blue-400">₦{level.palliative.toLocaleString()}</span>
                                  </div>
                                )}
                                {level.bpt > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">BPT:</span>
                                    <span className="font-medium text-purple-600 dark:text-purple-400">₦{level.bpt.toLocaleString()}</span>
                                  </div>
                                )}
                                {level.cashback > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Cashback:</span>
                                    <span className="font-medium text-amber-600 dark:text-amber-400">₦{level.cashback.toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-semibold text-muted-foreground">Level Total:</span>
                                  <span className="text-sm font-bold text-bpi-primary">₦{levelTotal.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Grand Total */}
                    <div className="bg-gradient-to-r from-bpi-primary to-bpi-secondary rounded-lg p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90 mb-1">Projected 12-Month Earnings</p>
                          <p className="text-3xl font-bold">₦{results.totals.grand.toLocaleString()}</p>
                        </div>
                        <Target className="w-12 h-12 opacity-20" />
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="opacity-80">Cash:</span>
                          <span className="ml-2 font-semibold">₦{results.totals.cash.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="opacity-80">Palliative:</span>
                          <span className="ml-2 font-semibold">₦{results.totals.palliative.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="opacity-80">BPT:</span>
                          <span className="ml-2 font-semibold">₦{results.totals.bpt.toLocaleString()}</span>
                        </div>
                        {results.totals.cashback > 0 && (
                          <div>
                            <span className="opacity-80">Cashback:</span>
                            <span className="ml-2 font-semibold">₦{results.totals.cashback.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        <strong>Disclaimer:</strong> This is a projection based on the assumption that you invite {personalInvites} person(s) who each activate the {results.package.name} package, and each of those persons invites 10 others who do the same, continuing for 4 levels. Actual earnings may vary based on real referral activity.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Select a membership package to see your earnings projection
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* History Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <History className="w-5 h-5 text-bpi-primary" />
                  Calculation History
                </h3>
                {calculationHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                  >
                    <FiX className="w-4 h-4" />
                    Clear History
                  </button>
                )}
              </div>

              {calculationHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No calculation history yet. Start by using the calculator!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {calculationHistory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-bpi-dark-card border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{item.packageName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Package Price: ₦{item.packagePrice.toLocaleString()}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Personal Invites</p>
                          <p className="text-lg font-bold text-foreground">{item.personalInvites}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Referrals</p>
                          <p className="text-lg font-bold text-foreground">{item.totalReferrals.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Earnings</p>
                          <p className="text-lg font-bold text-bpi-primary">₦{item.totalEarnings.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
