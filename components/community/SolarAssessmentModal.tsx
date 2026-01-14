"use client";

import { useState } from "react";
import { FiX, FiSun, FiChevronRight } from "react-icons/fi";
import { Sun, Zap, Home, MapPin, DollarSign, Calendar, CheckCircle } from "lucide-react";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";

interface SolarAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 1 | 2 | 3 | 4;

export default function SolarAssessmentModal({ isOpen, onClose }: SolarAssessmentModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    location: "",
    propertyType: "residential",
    roofType: "flat",
    roofArea: "",
    currentEnergyBill: "",
    averageMonthlyUsage: "",
    budgetRange: "",
  });

  const { data: assessments } = api.solarAssessment.getMyAssessments.useQuery();
  const { data: estimate } = api.solarAssessment.calculateEstimate.useQuery(
    { roofArea: parseFloat(formData.roofArea) || 0, monthlyBill: parseFloat(formData.currentEnergyBill) || 0 },
    { enabled: !!formData.roofArea && !!formData.currentEnergyBill }
  );

  const submitAssessment = api.solarAssessment.requestAssessment.useMutation({
    onSuccess: () => {
      toast.success("Assessment request submitted successfully!");
      onClose();
    },
  });

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((currentStep + 1) as Step);
  };

  const handleSubmit = () => {
    submitAssessment.mutate({
      address: formData.location,
      buildingType: formData.propertyType.toUpperCase() as "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL",
      roofArea: parseFloat(formData.roofArea),
      monthlyElectricityBill: parseFloat(formData.currentEnergyBill),
    });
  };

  const steps = [
    { num: 1, title: "Location", icon: MapPin },
    { num: 2, title: "Property", icon: Home },
    { num: 3, title: "Energy", icon: Zap },
    { num: 4, title: "Review", icon: CheckCircle },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-hidden bg-white dark:bg-bpi-dark-card rounded-2xl shadow-2xl animate-fadeIn">
        <div className="sticky top-0 z-20 bg-gradient-to-r from-yellow-500 via-orange-400 to-orange-500 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full"><FiSun className="w-7 h-7" /></div>
                <div><h2 className="text-2xl font-bold">Solar Assessment</h2><p className="text-orange-100 text-sm">Get your personalized solar energy evaluation</p></div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><FiX className="w-6 h-6" /></button>
            </div>
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.num} className="flex items-center flex-1">
                    <div className={`flex items-center gap-2 ${currentStep >= step.num ? 'text-white' : 'text-white/50'}`}>
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= step.num ? 'bg-white text-orange-500' : 'bg-white/20'}`}>
                        {currentStep > step.num ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <span className="font-medium text-sm hidden md:inline">{step.title}</span>
                    </div>
                    {index < steps.length - 1 && <div className={`h-0.5 flex-1 mx-2 ${currentStep > step.num ? 'bg-white' : 'bg-white/20'}`} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-220px)] p-6">
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
              <div><h3 className="text-xl font-semibold text-foreground mb-2">Where is your property located?</h3><p className="text-sm text-muted-foreground">We need this to calculate sunlight exposure and local regulations</p></div>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-foreground mb-2">Full Address</label><input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Enter your complete address" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-foreground" /></div>
                <div><label className="block text-sm font-medium text-foreground mb-2">Property Type</label><div className="grid grid-cols-3 gap-3">{['residential', 'commercial', 'industrial'].map((type) => (<button key={type} onClick={() => setFormData({ ...formData, propertyType: type })} className={`p-4 rounded-lg border-2 transition-all capitalize ${formData.propertyType === type ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}><Home className="w-6 h-6 mx-auto mb-2" /><span className="text-sm font-medium">{type}</span></button>))}</div></div>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
              <div><h3 className="text-xl font-semibold text-foreground mb-2">Tell us about your roof</h3><p className="text-sm text-muted-foreground">This helps us determine the optimal panel configuration</p></div>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-foreground mb-2">Roof Type</label><div className="grid grid-cols-2 gap-3">{[{ value: 'flat', label: 'Flat Roof' }, { value: 'pitched', label: 'Pitched Roof' }, { value: 'mixed', label: 'Mixed' }, { value: 'other', label: 'Other' }].map((type) => (<button key={type.value} onClick={() => setFormData({ ...formData, roofType: type.value })} className={`p-4 rounded-lg border-2 transition-all ${formData.roofType === type.value ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}><span className="text-sm font-medium">{type.label}</span></button>))}</div></div>
                <div><label className="block text-sm font-medium text-foreground mb-2">Roof Area (sq meters)</label><input type="number" value={formData.roofArea} onChange={(e) => setFormData({ ...formData, roofArea: e.target.value })} placeholder="Approximate roof area" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-foreground" /></div>
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
              <div><h3 className="text-xl font-semibold text-foreground mb-2">Current energy usage</h3><p className="text-sm text-muted-foreground">Help us calculate your potential savings</p></div>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-foreground mb-2">Monthly Electricity Bill (₦)</label><input type="number" value={formData.currentEnergyBill} onChange={(e) => setFormData({ ...formData, currentEnergyBill: e.target.value })} placeholder="Average monthly bill" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-foreground" /></div>
                <div><label className="block text-sm font-medium text-foreground mb-2">Average Monthly Usage (kWh)</label><input type="number" value={formData.averageMonthlyUsage} onChange={(e) => setFormData({ ...formData, averageMonthlyUsage: e.target.value })} placeholder="Check your utility bill" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-foreground" /></div>
                <div><label className="block text-sm font-medium text-foreground mb-2">Budget Range (₦)</label><select value={formData.budgetRange} onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-foreground"><option value="">Select budget range</option><option value="under-1m">Under ₦1,000,000</option><option value="1m-3m">₦1,000,000 - ₦3,000,000</option><option value="3m-5m">₦3,000,000 - ₦5,000,000</option><option value="5m-plus">₦5,000,000+</option></select></div>
              </div>
            </div>
          )}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
              <div><h3 className="text-xl font-semibold text-foreground mb-2">Review & Estimate</h3><p className="text-sm text-muted-foreground">Here's your personalized solar assessment</p></div>
              {estimate && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-5 text-white shadow-lg"><div className="flex items-center gap-2 mb-2"><Sun className="w-5 h-5" /><span className="text-sm font-medium opacity-90">Estimated System Size</span></div><p className="text-3xl font-bold">{estimate.estimatedPanels} panels</p><p className="text-xs opacity-75 mt-1">Based on your roof area</p></div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg"><div className="flex items-center gap-2 mb-2"><DollarSign className="w-5 h-5" /><span className="text-sm font-medium opacity-90">Monthly Savings</span></div><p className="text-3xl font-bold">₦{estimate.monthlySavings.toLocaleString()}</p><p className="text-xs opacity-75 mt-1">Estimated average</p></div>
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-5 text-white shadow-lg"><div className="flex items-center gap-2 mb-2"><Zap className="w-5 h-5" /><span className="text-sm font-medium opacity-90">Estimated Cost</span></div><p className="text-3xl font-bold">₦{estimate.estimatedCost.toLocaleString()}</p><p className="text-xs opacity-75 mt-1">Installation included</p></div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white shadow-lg"><div className="flex items-center gap-2 mb-2"><Calendar className="w-5 h-5" /><span className="text-sm font-medium opacity-90">Payback Period</span></div><p className="text-3xl font-bold">{estimate.paybackPeriod} years</p><p className="text-xs opacity-75 mt-1">Return on investment</p></div>
              </div>)}
              <div className="bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent rounded-xl p-6">
                <h4 className="font-semibold text-foreground mb-3">Your Details</h4>
                <dl className="space-y-2 text-sm"><div className="flex justify-between"><dt className="text-muted-foreground">Location:</dt><dd className="font-medium text-foreground">{formData.location}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Property Type:</dt><dd className="font-medium text-foreground capitalize">{formData.propertyType}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Roof Area:</dt><dd className="font-medium text-foreground">{formData.roofArea} sq m</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Monthly Bill:</dt><dd className="font-medium text-foreground">₦{parseFloat(formData.currentEnergyBill).toLocaleString()}</dd></div></dl>
              </div>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 z-20 bg-white dark:bg-bpi-dark-card border-t border-bpi-border dark:border-bpi-dark-accent p-6">
          <div className="flex justify-between gap-4">
            {currentStep > 1 && <button onClick={() => setCurrentStep((currentStep - 1) as Step)} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-foreground rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Previous</button>}
            {currentStep < 4 ? <button onClick={handleNext} disabled={!formData.location && currentStep === 1} className="ml-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">Next <FiChevronRight /></button> : <button onClick={handleSubmit} disabled={submitAssessment.isPending} className="ml-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50">{submitAssessment.isPending ? 'Submitting...' : 'Request Assessment'}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
