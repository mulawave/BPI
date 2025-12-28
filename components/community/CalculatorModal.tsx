"use client";

import { useState } from "react";
import { trpc } from "@/client/trpc";
import { Modal } from "@/components/ui/Modal";
import { Calculator, TrendingUp, Calendar, DollarSign, Users, X, Save, Trash2 } from "lucide-react";

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CalculationResult {
  packageName: string;
  investment: number;
  timePeriod: number;
  directReferrals: number;
  gen2Referrals: number;
  gen3Referrals: number;
  gen4Referrals: number;
  breakdown: {
    directEarnings: number;
    gen2Earnings: number;
    gen3Earnings: number;
    gen4Earnings: number;
    maturityBonus: number;
    totalEarnings: number;
  };
  metrics: {
    roi: number;
    breakEvenMonths: number;
    monthlyPassive: number;
    dailyPassive: number;
  };
  recommendations: string[];
}

export default function CalculatorModal({ isOpen, onClose }: CalculatorModalProps) {
  const [packageLevel, setPackageLevel] = useState("2");
  const [timePeriod, setTimePeriod] = useState("12");
  const [directReferrals, setDirectReferrals] = useState("5");
  const [gen2Referrals, setGen2Referrals] = useState("10");
  const [gen3Referrals, setGen3Referrals] = useState("5");
  const [gen4Referrals, setGen4Referrals] = useState("0");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const calculateMutation = trpc.communityCalculator.calculateEarnings.useMutation();
  const historyQuery = trpc.communityCalculator.getHistory.useQuery(undefined, {
    enabled: showHistory,
  });
  const deleteCalculationMutation = trpc.communityCalculator.deleteCalculation.useMutation();

  const packageOptions = [
    { value: "1", name: "Starter - ₱500", investment: 500 },
    { value: "2", name: "Basic - ₱1,000", investment: 1000 },
    { value: "3", name: "Regular - ₱2,000", investment: 2000 },
    { value: "4", name: "Regular Plus - ₱5,000", investment: 5000 },
    { value: "5", name: "Premium - ₱10,000", investment: 10000 },
  ];

  const handleCalculate = async () => {
    try {
      const calculationResult = await calculateMutation.mutateAsync({
        packageLevel: parseInt(packageLevel),
        timePeriod: parseInt(timePeriod),
        directReferrals: parseInt(directReferrals),
        gen2Referrals: parseInt(gen2Referrals),
        gen3Referrals: parseInt(gen3Referrals),
        gen4Referrals: parseInt(gen4Referrals),
        saveCalculation: true,
      });

      setResult(calculationResult as CalculationResult);
    } catch (error) {
      console.error("Calculation error:", error);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await deleteCalculationMutation.mutateAsync({ id });
      await historyQuery.refetch();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const selectedPackage = packageOptions.find((p) => p.value === packageLevel);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-full">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">BPI Earnings Calculator</h2>
              <p className="text-green-100 text-sm">
                Calculate your potential earnings with BPI membership packages
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b">
              <button
                onClick={() => setShowHistory(false)}
                className={`px-4 py-2 font-medium transition-colors ${
                  !showHistory
                    ? "text-green-600 border-b-2 border-green-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Calculator className="w-4 h-4 inline mr-2" />
                Calculate
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className={`px-4 py-2 font-medium transition-colors ${
                  showHistory
                    ? "text-green-600 border-b-2 border-green-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Save className="w-4 h-4 inline mr-2" />
                History
              </button>
            </div>

            {!showHistory ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Calculation Parameters
                  </h3>

                  {/* Package Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Package
                    </label>
                    <select
                      value={packageLevel}
                      onChange={(e) => setPackageLevel(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {packageOptions.map((pkg) => (
                        <option key={pkg.value} value={pkg.value}>
                          {pkg.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time Period */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Time Period (Months)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={timePeriod}
                      onChange={(e) => setTimePeriod(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Direct Referrals */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users className="w-4 h-4 inline mr-1" />
                      Direct Referrals (Gen 1)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={directReferrals}
                      onChange={(e) => setDirectReferrals(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">10% commission per referral</p>
                  </div>

                  {/* Generation 2 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Second Generation Referrals (Gen 2)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      value={gen2Referrals}
                      onChange={(e) => setGen2Referrals(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">5% commission per referral</p>
                  </div>

                  {/* Generation 3 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Third Generation Referrals (Gen 3)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100000"
                      value={gen3Referrals}
                      onChange={(e) => setGen3Referrals(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">3% commission per referral</p>
                  </div>

                  {/* Generation 4 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fourth Generation Referrals (Gen 4)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1000000"
                      value={gen4Referrals}
                      onChange={(e) => setGen4Referrals(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">2% commission per referral</p>
                  </div>

                  {/* Calculate Button */}
                  <button
                    onClick={handleCalculate}
                    disabled={calculateMutation.isPending}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {calculateMutation.isPending ? "Calculating..." : "Calculate Earnings"}
                  </button>
                </div>

                {/* Results Section */}
                <div className="space-y-4">
                  {result ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Your Projected Earnings
                      </h3>

                      {/* Investment Summary */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Initial Investment</span>
                          <span className="text-xl font-bold text-blue-900">
                            {formatCurrency(result.investment)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-blue-700">Package</span>
                          <span className="text-sm font-semibold text-blue-800">
                            {result.packageName}
                          </span>
                        </div>
                      </div>

                      {/* Earnings Breakdown */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold text-gray-700 border-b pb-2">
                          Earnings Breakdown
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Direct Referrals (10%)</span>
                            <span className="font-semibold text-green-600">
                              {formatCurrency(result.breakdown.directEarnings)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Gen 2 (5%)</span>
                            <span className="font-semibold text-green-600">
                              {formatCurrency(result.breakdown.gen2Earnings)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Gen 3 (3%)</span>
                            <span className="font-semibold text-green-600">
                              {formatCurrency(result.breakdown.gen3Earnings)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Gen 4 (2%)</span>
                            <span className="font-semibold text-green-600">
                              {formatCurrency(result.breakdown.gen4Earnings)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-gray-600">
                              Maturity Bonus (150% after 12 months)
                            </span>
                            <span className="font-semibold text-emerald-600">
                              {formatCurrency(result.breakdown.maturityBonus)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Total Earnings */}
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-lg text-white">
                        <div className="flex justify-between items-center">
                          <span className="text-sm opacity-90">Total Projected Earnings</span>
                          <span className="text-2xl font-bold">
                            {formatCurrency(result.breakdown.totalEarnings)}
                          </span>
                        </div>
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                          <p className="text-xs text-purple-700">ROI</p>
                          <p className="text-lg font-bold text-purple-900">
                            {result.metrics.roi.toFixed(1)}%
                          </p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <p className="text-xs text-orange-700">Break-Even</p>
                          <p className="text-lg font-bold text-orange-900">
                            {result.metrics.breakEvenMonths} months
                          </p>
                        </div>
                        <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                          <p className="text-xs text-teal-700">Monthly Passive</p>
                          <p className="text-sm font-bold text-teal-900">
                            {formatCurrency(result.metrics.monthlyPassive)}
                          </p>
                        </div>
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                          <p className="text-xs text-indigo-700">Daily Passive</p>
                          <p className="text-sm font-bold text-indigo-900">
                            {formatCurrency(result.metrics.dailyPassive)}
                          </p>
                        </div>
                      </div>

                      {/* Recommendations */}
                      {result.recommendations.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="font-semibold text-yellow-800 mb-2 text-sm">
                            💡 Recommendations
                          </h4>
                          <ul className="text-xs text-yellow-700 space-y-1">
                            {result.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="mt-0.5">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
                      <Calculator className="w-16 h-16 mb-4 opacity-50" />
                      <p className="text-sm">Enter your parameters and click Calculate</p>
                      <p className="text-xs">Results will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* History View */
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Calculation History
                </h3>
                {historyQuery.isLoading ? (
                  <div className="text-center py-12 text-gray-400">Loading...</div>
                ) : historyQuery.data && historyQuery.data.length > 0 ? (
                  <div className="space-y-3">
                    {historyQuery.data.map((calc: any) => (
                      <div
                        key={calc.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-800">
                              {calc.packageName || `Package Level ${calc.packageLevel}`}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {new Date(calc.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteHistory(calc.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs">Investment</p>
                            <p className="font-semibold">
                              {formatCurrency(calc.investment)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Total Earnings</p>
                            <p className="font-semibold text-green-600">
                              {formatCurrency(calc.totalEarnings)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">ROI</p>
                            <p className="font-semibold text-purple-600">{calc.roi}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Period</p>
                            <p className="font-semibold">{calc.timePeriod} months</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Save className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No calculation history yet</p>
                    <p className="text-xs">Calculations you save will appear here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            <strong>Disclaimer:</strong> These calculations are projections based on current commission
            rates and are not guaranteed. Actual earnings may vary based on referral performance, market
            conditions, and program terms.
          </p>
        </div>
      </div>
    </Modal>
  );
}
