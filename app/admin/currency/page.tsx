"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  MdEdit,
  MdDelete,
  MdAdd,
  MdCheckCircle,
  MdTrendingUp,
  MdRefresh,
  MdAttachMoney,
  MdHistory,
  MdInfo,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";
import { Loader2 } from "lucide-react";
import { api } from "@/client/trpc";

interface CurrencyFormData {
  name: string;
  symbol: string;
  sign: string;
  rate: string;
  country?: string;
}

export default function CurrencyManagementPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<any>(null);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [bpTokenPrice, setBpTokenPrice] = useState("");
  const [formData, setFormData] = useState<CurrencyFormData>({
    name: "",
    symbol: "",
    sign: "",
    rate: "",
    country: "",
  });

  const utils = api.useUtils();

  // Queries
  const { data: currencies = [], isLoading } = api.adminCurrency.getAllCurrencies.useQuery();
  const { data: stats } = api.adminCurrency.getCurrencyStats.useQuery();
  const { data: currentBPPrice } = api.adminCurrency.getBPTokenPrice.useQuery();
  const { data: priceHistory = [] } = api.adminCurrency.getBPTokenPriceHistory.useQuery(
    { limit: 20 },
    { enabled: showPriceHistory }
  );

  // Mutations
  const updateRate = api.adminCurrency.updateCurrencyRate.useMutation({
    onSuccess: () => {
      toast.success("Currency rate updated successfully");
      utils.adminCurrency.getAllCurrencies.invalidate();
      utils.adminCurrency.getCurrencyStats.invalidate();
      utils.currency.getAll.invalidate();
      setEditingCurrency(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update currency rate");
    },
  });

  const setDefault = api.adminCurrency.setDefaultCurrency.useMutation({
    onSuccess: () => {
      toast.success("Default currency updated");
      utils.adminCurrency.getAllCurrencies.invalidate();
      utils.adminCurrency.getCurrencyStats.invalidate();
      utils.currency.getDefault.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to set default currency");
    },
  });

  const addCurrency = api.adminCurrency.addCurrency.useMutation({
    onSuccess: () => {
      toast.success("Currency added successfully");
      utils.adminCurrency.getAllCurrencies.invalidate();
      utils.adminCurrency.getCurrencyStats.invalidate();
      utils.currency.getAll.invalidate();
      setShowAddModal(false);
      setFormData({ name: "", symbol: "", sign: "", rate: "", country: "" });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add currency");
    },
  });

  const deleteCurrency = api.adminCurrency.deleteCurrency.useMutation({
    onSuccess: () => {
      toast.success("Currency deleted successfully");
      utils.adminCurrency.getAllCurrencies.invalidate();
      utils.adminCurrency.getCurrencyStats.invalidate();
      utils.currency.getAll.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete currency");
    },
  });

  const updateBPPrice = api.adminCurrency.updateBPTokenPrice.useMutation({
    onSuccess: () => {
      toast.success("BPToken price updated successfully");
      utils.adminCurrency.getBPTokenPrice.invalidate();
      utils.adminCurrency.getCurrencyStats.invalidate();
      utils.adminCurrency.getBPTokenPriceHistory.invalidate();
      setBpTokenPrice("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update BPToken price");
    },
  });

  const handleUpdateRate = (currencyId: string, newRate: number) => {
    updateRate.mutate({ currencyId, rate: newRate });
  };

  const handleAddCurrency = () => {
    const rate = parseFloat(formData.rate);
    if (isNaN(rate) || rate <= 0) {
      toast.error("Please enter a valid exchange rate");
      return;
    }

    addCurrency.mutate({
      name: formData.name,
      symbol: formData.symbol.toUpperCase(),
      sign: formData.sign,
      rate,
      country: formData.country || undefined,
    });
  };

  const handleUpdateBPPrice = () => {
    const price = parseFloat(bpTokenPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    updateBPPrice.mutate({ price });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 dark:from-bpi-dark-bg dark:via-bpi-dark-card dark:to-bpi-dark-bg p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Currency Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage exchange rates and BPToken pricing
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg transition-all"
          >
            <MdAdd className="w-5 h-5" />
            Add Currency
          </button>
        </motion.div>

        {/* User Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl shadow-lg border-2 border-blue-200 dark:border-blue-800 overflow-hidden"
        >
          <button
            onClick={() => setShowUserGuide(!showUserGuide)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <MdInfo className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  User Guide & Feature Overview
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to {showUserGuide ? "hide" : "view"} detailed instructions
                </p>
              </div>
            </div>
            {showUserGuide ? (
              <MdExpandLess className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            ) : (
              <MdExpandMore className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          <AnimatePresence>
            {showUserGuide && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-blue-200 dark:border-blue-800"
              >
                <div className="px-6 py-6 space-y-6">
                  {/* Stats Dashboard */}
                  <div>
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <MdCheckCircle className="w-5 h-5 text-blue-600" />
                      Stats Dashboard
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                      <li>Total active currencies in the system</li>
                      <li>Current default currency (base for all conversions)</li>
                      <li>Current BPToken price in NGN</li>
                    </ul>
                  </div>

                  {/* BPToken Management */}
                  <div>
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <MdTrendingUp className="w-5 h-5 text-purple-600" />
                      BPToken Management
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                      <li>Update BPToken price with instant global effect across the app</li>
                      <li>View price history with timestamps and admin tracking</li>
                      <li>Previous prices are automatically deactivated</li>
                      <li>Full audit trail maintained for compliance</li>
                    </ul>
                  </div>

                  {/* Currency Exchange Rates */}
                  <div>
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <MdAttachMoney className="w-5 h-5 text-green-600" />
                      Currency Exchange Rates
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                      <li>View all currencies in a clean, sortable table</li>
                      <li>Inline editing of exchange rates (click the edit icon)</li>
                      <li>Set default currency with one click</li>
                      <li>Add new currencies via modal form</li>
                      <li>Delete currencies (default currency is protected)</li>
                      <li>Real-time conversion rate display</li>
                    </ul>
                  </div>

                  {/* How It Works */}
                  <div className="pt-4 border-t border-blue-200 dark:border-blue-700">
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                      🎯 How It Works
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Currency Conversion Logic
                        </h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          The system uses <span className="font-bold text-green-600">NGN (Nigerian Naira)</span> as the base currency.
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          Exchange rates are stored as: <span className="font-mono bg-gray-100 dark:bg-bpi-dark-accent px-2 py-1 rounded">1 NGN = X units of foreign currency</span>
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3 mt-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Example:</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            If <span className="font-bold">$1 = ₦1,400</span>, then <span className="font-bold text-blue-600">1 NGN = 0.000714 USD</span>
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            💡 To calculate: 1 ÷ 1400 = 0.000714
                          </p>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                          BPToken Price Management
                        </h5>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                          <li>Admins set the price in NGN (base currency)</li>
                          <li>Previous prices are automatically deactivated when new price is set</li>
                          <li>Complete history is maintained for auditing</li>
                          <li>Changes take effect <span className="font-bold text-green-600">immediately</span> across the entire app</li>
                          <li>All user-facing displays update in real-time</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="pt-4 border-t border-blue-200 dark:border-blue-700">
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                      ✨ Features
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Framer Motion animations
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Toast notifications
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Loading states on all buttons
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Dark mode support
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Responsive design
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Input validation
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-white dark:bg-bpi-dark-card rounded-2xl shadow-lg border border-gray-200 dark:border-bpi-dark-accent"
          >
            <div className="flex items-center justify-between mb-2">
              <MdAttachMoney className="w-8 h-8 text-green-600" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.totalCurrencies || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Active Currencies
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-white dark:bg-bpi-dark-card rounded-2xl shadow-lg border border-gray-200 dark:border-bpi-dark-accent"
          >
            <div className="flex items-center justify-between mb-2">
              <MdCheckCircle className="w-8 h-8 text-blue-600" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Default</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.defaultCurrency || "NGN"}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Base Currency
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-white dark:bg-bpi-dark-card rounded-2xl shadow-lg border border-gray-200 dark:border-bpi-dark-accent"
          >
            <div className="flex items-center justify-between mb-2">
              <MdTrendingUp className="w-8 h-8 text-purple-600" />
              <span className="text-sm text-gray-500 dark:text-gray-400">BPToken</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              ₦{(currentBPPrice?.price || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Current Price
            </div>
          </motion.div>
        </div>

        {/* BPToken Price Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white dark:bg-bpi-dark-card rounded-2xl shadow-lg border border-gray-200 dark:border-bpi-dark-accent"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MdTrendingUp className="w-6 h-6 text-purple-600" />
              BPToken Price Management
            </h2>
            <button
              onClick={() => setShowPriceHistory(!showPriceHistory)}
              className="px-4 py-2 bg-gray-100 dark:bg-bpi-dark-accent hover:bg-gray-200 dark:hover:bg-bpi-dark-accent/80 text-gray-700 dark:text-gray-300 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <MdHistory className="w-5 h-5" />
              {showPriceHistory ? "Hide" : "Show"} History
            </button>
          </div>

          <div className="flex gap-4 mb-4">
            <input
              type="number"
              step="0.01"
              value={bpTokenPrice}
              onChange={(e) => setBpTokenPrice(e.target.value)}
              placeholder="Enter new BPToken price (NGN)"
              className="flex-1 px-4 py-3 bg-gray-50 dark:bg-bpi-dark-accent border border-gray-200 dark:border-bpi-dark-accent rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleUpdateBPPrice}
              disabled={updateBPPrice.isPending || !bpTokenPrice}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg disabled:cursor-not-allowed"
            >
              {updateBPPrice.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MdRefresh className="w-5 h-5" />
              )}
              Update Price
            </button>
          </div>

          {showPriceHistory && priceHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 space-y-2 max-h-64 overflow-y-auto"
            >
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Price History
              </h3>
              {priceHistory.map((record: any) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-bpi-dark-accent rounded-lg"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    ₦{record.price.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{new Date(record.updatedAt).toLocaleDateString()}</span>
                    <span>{new Date(record.updatedAt).toLocaleTimeString()}</span>
                    {record.active && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md text-xs font-medium">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Currency List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-bpi-dark-card rounded-2xl shadow-lg border border-gray-200 dark:border-bpi-dark-accent overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 dark:border-bpi-dark-accent">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MdAttachMoney className="w-6 h-6 text-green-600" />
              Currency Exchange Rates
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              1 NGN = X units of each currency
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-bpi-dark-accent/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Currency
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Sign
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Rate (1 NGN =)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-bpi-dark-accent">
                {currencies.map((currency: any, index: number) => (
                  <motion.tr
                    key={currency.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-bpi-dark-accent/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {currency.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-700 dark:text-gray-300 font-mono">
                        {currency.symbol}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xl text-gray-700 dark:text-gray-300">
                        {currency.sign}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCurrency?.id === currency.id ? (
                        <input
                          type="number"
                          step="0.000001"
                          defaultValue={currency.rate}
                          onBlur={(e) => {
                            const newRate = parseFloat(e.target.value);
                            if (!isNaN(newRate) && newRate > 0) {
                              handleUpdateRate(currency.id, newRate);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const newRate = parseFloat(e.currentTarget.value);
                              if (!isNaN(newRate) && newRate > 0) {
                                handleUpdateRate(currency.id, newRate);
                              }
                            }
                          }}
                          className="w-32 px-2 py-1 bg-gray-50 dark:bg-bpi-dark-accent border border-gray-300 dark:border-bpi-dark-accent rounded text-gray-900 dark:text-white"
                          autoFocus
                        />
                      ) : (
                        <div className="text-gray-700 dark:text-gray-300 font-mono">
                          {currency.rate.toFixed(6)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-600 dark:text-gray-400">
                        {currency.country || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {currency.default === 1 ? (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                          Default
                        </span>
                      ) : (
                        <button
                          onClick={() => setDefault.mutate({ currencyId: currency.id })}
                          disabled={setDefault.isPending}
                          className="px-3 py-1 bg-gray-100 dark:bg-bpi-dark-accent hover:bg-gray-200 dark:hover:bg-bpi-dark-accent/80 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          Set Default
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingCurrency(currency)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Edit Rate"
                        >
                          <MdEdit className="w-5 h-5" />
                        </button>
                        {currency.default !== 1 && (
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Are you sure you want to delete ${currency.name}?`
                                )
                              ) {
                                deleteCurrency.mutate({ currencyId: currency.id });
                              }
                            }}
                            disabled={deleteCurrency.isPending}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Currency"
                          >
                            <MdDelete className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Add Currency Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-bpi-dark-card rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Add New Currency
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Currency Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., US Dollar"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-bpi-dark-accent border border-gray-200 dark:border-bpi-dark-accent rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Currency Code/Symbol
                  </label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    placeholder="e.g., USD"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-bpi-dark-accent border border-gray-200 dark:border-bpi-dark-accent rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Currency Sign
                  </label>
                  <input
                    type="text"
                    value={formData.sign}
                    onChange={(e) => setFormData({ ...formData, sign: e.target.value })}
                    placeholder="e.g., $"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-bpi-dark-accent border border-gray-200 dark:border-bpi-dark-accent rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exchange Rate (1 NGN =)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    placeholder="e.g., 0.000714 (for $1 = ₦1400)"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-bpi-dark-accent border border-gray-200 dark:border-bpi-dark-accent rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Example: If $1 = ₦1400, then 1 NGN = 0.000714 USD
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g., United States"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-bpi-dark-accent border border-gray-200 dark:border-bpi-dark-accent rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-bpi-dark-accent hover:bg-gray-200 dark:hover:bg-bpi-dark-accent/80 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCurrency}
                  disabled={
                    addCurrency.isPending ||
                    !formData.name ||
                    !formData.symbol ||
                    !formData.sign ||
                    !formData.rate
                  }
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg disabled:cursor-not-allowed"
                >
                  {addCurrency.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <MdAdd className="w-5 h-5" />
                  )}
                  Add Currency
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
