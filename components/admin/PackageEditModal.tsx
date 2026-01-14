"use client";

import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  MdClose,
  MdSave,
  MdAdd,
  MdRemove,
} from "react-icons/md";

interface PackageEditModalProps {
  packageId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PackageEditModal({
  packageId,
  isOpen,
  onClose,
}: PackageEditModalProps) {
  const utils = api.useContext();
  const { data: pkg } = api.admin.getPackageById.useQuery(
    { packageId },
    { enabled: isOpen && !!packageId }
  );

  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    vat: 0,
    renewalFee: 0,
    isActive: true,
    features: [] as string[],
  });

  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    if (pkg) {
      setFormData({
        name: pkg.name,
        price: pkg.price,
        vat: pkg.vat,
        renewalFee: pkg.renewalFee || 0,
        isActive: pkg.isActive,
        features: pkg.features || [],
      });
    }
  }, [pkg]);

  const updateMutation = api.admin.updatePackage.useMutation({
    onSuccess: () => {
      toast.success("Package updated successfully");
      utils.admin.getPackages.invalidate();
      utils.admin.getPackageById.invalidate();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update package");
    },
  });

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

    updateMutation.mutate({
      packageId,
      data: {
        name: formData.name.trim(),
        price: formData.price,
        vat: formData.vat,
        renewalFee: formData.renewalFee > 0 ? formData.renewalFee : undefined,
        isActive: formData.isActive,
        features: formData.features.filter((f) => f.trim()),
      },
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edit Package
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
                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Package Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-[#0d3b29]"
                      placeholder="Enter package name"
                      required
                    />
                  </div>

                  {/* Price & VAT */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Base Price (₦)
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-[#0d3b29]"
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

                  {/* Total Price Display */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Total Price (Base + VAT):
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
                  <div>
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-[#0d3b29]"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  {/* Status Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Package Status
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Active packages are available for purchase
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

                  {/* Features */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Package Features
                    </label>
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
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-[#0d3b29]"
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
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-[#0d3b29]"
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
                  disabled={updateMutation.isPending}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <MdSave size={20} />
                      Save Changes
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
