"use client";

import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  MdClose,
  MdSave,
  MdAdd,
  MdRemove,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";

interface PackageCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PackageCreateModal({
  isOpen,
  onClose,
}: PackageCreateModalProps) {
  const utils = api.useContext();

  // Get all packages for base package selection
  const { data: existingPackages } = api.admin.getPackages.useQuery({});

  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    vat: 0,
    baseMembershipPackageId: "",
    packageType: "STANDARD",
    renewalFee: 0,
    isActive: true,
    features: [] as string[],
    // Activation rewards
    cash_l1: 0,
    cash_l2: 0,
    cash_l3: 0,
    cash_l4: 0,
    bpt_l1: 0,
    bpt_l2: 0,
    bpt_l3: 0,
    bpt_l4: 0,
    palliative_l1: 0,
    palliative_l2: 0,
    palliative_l3: 0,
    palliative_l4: 0,
  });

  const [newFeature, setNewFeature] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const createMutation = api.admin.createPackage.useMutation({
    onSuccess: () => {
      toast.success("Package created successfully");
      utils.admin.getPackages.invalidate();
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create package");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      price: 0,
      vat: 0,
      baseMembershipPackageId: "",
      packageType: "STANDARD",
      renewalFee: 0,
      isActive: true,
      features: [],
      cash_l1: 0,
      cash_l2: 0,
      cash_l3: 0,
      cash_l4: 0,
      bpt_l1: 0,
      bpt_l2: 0,
      bpt_l3: 0,
      bpt_l4: 0,
      palliative_l1: 0,
      palliative_l2: 0,
      palliative_l3: 0,
      palliative_l4: 0,
    });
    setNewFeature("");
    setShowAdvanced(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Package name is required");
      return;
    }

    if (formData.price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    createMutation.mutate({
      ...formData,
      name: formData.name.trim(),
      renewalFee: formData.renewalFee > 0 ? formData.renewalFee : undefined,
      features: formData.features.filter((f) => f.trim()),
    });
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const calculateVAT = (price: number) => {
    return price * 0.075;
  };

  const handlePriceChange = (value: number) => {
    setFormData((prev) => ({
      ...prev,
      price: value,
      vat: calculateVAT(value),
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create New Package
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <MdClose size={24} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Basic Info */}
                  <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-green-900/30 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Basic Information
                      </h3>

                      {/* Name */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Package Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, name: e.target.value }))
                          }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#0d3b29]"
                          placeholder="Enter package name"
                          required
                        />
                      </div>

                      {/* Package Type */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Package Type
                        </label>
                        <select
                          value={formData.packageType}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, packageType: e.target.value }))
                          }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#0d3b29]"
                        >
                          <option value="STANDARD">STANDARD</option>
                          <option value="PREMIUM">PREMIUM</option>
                          <option value="EMPOWERMENT">EMPOWERMENT</option>
                        </select>
                      </div>

                      {/* Base Membership Package (for feature bundles) */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Base Membership Package (Optional)
                        </label>
                        <select
                          value={formData.baseMembershipPackageId}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, baseMembershipPackageId: e.target.value }))
                          }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#0d3b29]"
                        >
                          <option value="">None (Tier Upgrade)</option>
                          {existingPackages?.map(pkg => (
                            <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Select a base tier if this is a feature add-on/bundle. Leave empty for tier upgrades.
                        </p>
                      </div>

                      {/* Price & VAT */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Base Price (₦) *
                          </label>
                          <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#0d3b29]"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            VAT (7.5%)
                          </label>
                          <input
                            type="number"
                            value={formData.vat.toFixed(2)}
                            readOnly
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Total Price */}
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Total Price:
                          </span>
                          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                            ₦{(formData.price + formData.vat).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Renewal Fee */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Renewal Fee (₦) - Optional
                        </label>
                        <input
                          type="number"
                          value={formData.renewalFee}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              renewalFee: parseFloat(e.target.value) || 0,
                            }))
                          }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#0d3b29]"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>

                      {/* Status Toggle */}
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Active on Creation
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Package will be available for purchase
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
                          }
                          className={`relative w-14 h-8 rounded-full transition-colors ${
                            formData.isActive
                              ? "bg-green-600"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                              formData.isActive ? "translate-x-6" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Features */}
                  <div className="bg-gray-50 dark:bg-green-900/30 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Package Features
                      </h3>
                      <div className="space-y-2">
                        {formData.features.map((feature, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="text"
                              value={feature}
                              onChange={(e) => {
                                const newFeatures = [...formData.features];
                                newFeatures[idx] = e.target.value;
                                setFormData((prev) => ({ ...prev, features: newFeatures }));
                              }}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#0d3b29]"
                            />
                            <button
                              type="button"
                              onClick={() => removeFeature(idx)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <MdRemove size={20} />
                            </button>
                          </motion.div>
                        ))}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addFeature();
                              }
                            }}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#0d3b29]"
                            placeholder="Add a new feature..."
                          />
                          <button
                            type="button"
                            onClick={addFeature}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          >
                            <MdAdd size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Referral Rewards */}
                  <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-green-900/30 rounded-xl p-6">
                      <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full flex items-center justify-between mb-4"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Referral Rewards (Advanced)
                        </h3>
                        {showAdvanced ? (
                          <MdExpandLess size={24} className="text-gray-600 dark:text-gray-400" />
                        ) : (
                          <MdExpandMore size={24} className="text-gray-600 dark:text-gray-400" />
                        )}
                      </button>

                      {showAdvanced && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                            >
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                                Level {level} Rewards
                              </h4>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                    Cash (₦)
                                  </label>
                                  <input
                                    type="number"
                                    value={formData[`cash_l${level}` as keyof typeof formData] as number}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        [`cash_l${level}`]: parseFloat(e.target.value) || 0,
                                      }))
                                    }
                                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#0d3b29]"
                                    step="0.01"
                                    min="0"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                    BPT (₦)
                                  </label>
                                  <input
                                    type="number"
                                    value={formData[`bpt_l${level}` as keyof typeof formData] as number}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        [`bpt_l${level}`]: parseFloat(e.target.value) || 0,
                                      }))
                                    }
                                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#0d3b29]"
                                    step="0.01"
                                    min="0"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                    Palliative (₦)
                                  </label>
                                  <input
                                    type="number"
                                    value={
                                      formData[`palliative_l${level}` as keyof typeof formData] as number
                                    }
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        [`palliative_l${level}`]: parseFloat(e.target.value) || 0,
                                      }))
                                    }
                                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-green-900/30 text-gray-900 dark:text-white focus:outline-none focus:border-[#0d3b29]"
                                    step="0.01"
                                    min="0"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                            Set referral rewards for each level. Leave at 0 to disable rewards for that
                            level.
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </form>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <MdSave size={20} />
                      Create Package
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
