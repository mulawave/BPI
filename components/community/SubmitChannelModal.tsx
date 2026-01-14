"use client";

import { useState, useEffect } from "react";
import { FiX, FiYoutube, FiCheck, FiCopy, FiCreditCard, FiFileText, FiShield } from "react-icons/fi";
import { api } from "@/client/trpc";

interface SubmitChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "select-plan" | "channel-form" | "verification";

const STEPS = [
  { id: "select-plan", label: "Select Plan", icon: FiCreditCard },
  { id: "channel-form", label: "Channel Details", icon: FiFileText },
  { id: "verification", label: "Verification", icon: FiShield },
] as const;

export default function SubmitChannelModal({ isOpen, onClose }: SubmitChannelModalProps) {
  const [step, setStep] = useState<Step>("select-plan");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [channelName, setChannelName] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [channelLink, setChannelLink] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: plans = [] } = api.youtube.getPlans.useQuery();
  const { data: userChannel } = api.youtube.getUserChannel.useQuery();
  const { data: draftStatus } = api.youtube.checkDraftStatus.useQuery();
  const { data: user } = api.user.getDetails.useQuery();
  const userBalance = user?.wallet || 0;

  // Auto-save draft mutation
  const saveDraftMutation = api.youtube.saveDraft.useMutation();

  // Load draft data on mount if exists
  useEffect(() => {
    if (draftStatus?.hasDraft && draftStatus.draftData) {
      const draft = draftStatus.draftData;
      setDraftId(draft.id);
      setChannelName(draft.channelName || "");
      setChannelUrl(draft.channelUrl || "");
      setChannelLink(draft.channelLink || "");
      setVerificationCode(draft.verificationCode || "");
      
      // If draft is submitted, go to verification step
      if (draft.status === "SUBMITTED") {
        setStep("verification");
      } else {
        // Go to channel form to resume
        setStep("channel-form");
      }
    }
  }, [draftStatus]);

  // Auto-save draft as user types (debounced)
  useEffect(() => {
    if (!draftId) return;
    
    const timer = setTimeout(() => {
      if (channelName || channelUrl || channelLink) {
        saveDraftMutation.mutate({
          draftId,
          channelName,
          channelUrl,
          channelLink
        });
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [channelName, channelUrl, channelLink, draftId]);

  const purchasePlanMutation = api.youtube.purchasePlan.useMutation({
    onSuccess: (data) => {
      setDraftId(data.draftId);
      setVerificationCode(data.verificationCode || "");
      setProgressPercent(100);
      setErrorMessage(null);
      setTimeout(() => {
        setStep("channel-form");
        setProgressPercent(0);
      }, 500);
    },
    onError: (error: any) => {
      setErrorMessage(error.message || "Failed to purchase plan. Please try again.");
      setProgressPercent(0);
    },
  });

  const submitChannelMutation = api.youtube.submitChannel.useMutation({
    onSuccess: (data: any) => {
      setVerificationCode(data.verificationCode);
      setProgressPercent(100);
      setErrorMessage(null);
      setTimeout(() => {
        setStep("verification");
        setProgressPercent(0);
      }, 500);
    },
    onError: (error: any) => {
      setErrorMessage(error.message || "Failed to submit channel. Please try again.");
      setProgressPercent(0);
    },
  });

  // Simulate progress bar during mutations
  useEffect(() => {
    if (purchasePlanMutation.isPending || submitChannelMutation.isPending) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        if (progress <= 90) {
          setProgressPercent(progress);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [purchasePlanMutation.isPending, submitChannelMutation.isPending]);

  const calculateTotalCost = (planAmount: number | any) => {
    const amount = typeof planAmount === 'number' ? planAmount : Number(planAmount);
    const vat = amount * 0.075;
    return amount + vat;
  };

  const canAffordPlan = (planAmount: number) => {
    return userBalance >= calculateTotalCost(planAmount);
  };

  const handlePlanSelect = async (planId: string) => {
    setSelectedPlan(planId);
    purchasePlanMutation.mutate({ planId });
  };

  const handleSubmitChannel = async () => {
    if (!channelName || !channelUrl || !channelLink) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    setErrorMessage(null);
    submitChannelMutation.mutate({
      draftId: draftId || undefined,
      channelName,
      channelUrl,
      channelLink
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(verificationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    // Don't clear form data if there's a draft - user can resume later
    if (!draftId) {
      setStep("select-plan");
      setSelectedPlan(null);
      setChannelName("");
      setChannelUrl("");
      setChannelLink("");
      setVerificationCode("");
      setCopied(false);
      setProgressPercent(0);
    }
    setProgressPercent(0);
    onClose();
  };

  const getCurrentStepIndex = () => {
    return STEPS.findIndex(s => s.id === step);
  };

  const getStepStatus = (stepId: string) => {
    const currentIndex = getCurrentStepIndex();
    const stepIndex = STEPS.findIndex(s => s.id === stepId);
    
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  if (!isOpen) return null;

  // If user already has a channel, show different content
  if (userChannel && step === "select-plan") {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />
        <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl m-4">
          <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <FiYoutube className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">YouTube Channel</h2>
                  <p className="text-red-50 text-sm">Channel Status</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">Channel Submitted</h3>
              <p className="text-sm text-blue-700 mb-1">
                <strong>Channel Name:</strong> {userChannel.channelName}
              </p>
              <p className="text-sm text-blue-700 mb-1">
                <strong>Status:</strong> {userChannel.status}
              </p>
              <p className="text-sm text-blue-700">
                <strong>Verified:</strong> {userChannel.isVerified ? "Yes" : "Pending"}
              </p>
            </div>

            {!userChannel.isVerified && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Your channel is pending verification. Please ensure you have added the verification code to your channel description.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl m-4 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FiYoutube className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Submit YouTube Channel</h2>
                <p className="text-red-50 text-sm">
                  Get subscribers and grow your channel
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between relative">
            {STEPS.map((s, index) => {
              const status = getStepStatus(s.id);
              const Icon = s.icon;
              
              return (
                <div key={s.id} className="flex-1 relative">
                  <div className="flex flex-col items-center relative z-10">
                    {/* Circle */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        status === "completed"
                          ? "bg-green-500 shadow-lg shadow-green-500/50"
                          : status === "current"
                          ? "bg-white text-red-600 shadow-lg shadow-white/50 scale-110"
                          : "bg-white/20 text-white/60"
                      }`}
                    >
                      {status === "completed" ? (
                        <FiCheck className="w-6 h-6" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    {/* Label */}
                    <span
                      className={`mt-2 text-xs font-medium transition-all ${
                        status === "current" ? "text-white font-semibold" : "text-red-100"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  
                  {/* Connector Line */}
                  {index < STEPS.length - 1 && (
                    <div className="absolute top-6 left-1/2 w-full h-0.5 -z-0">
                      <div
                        className={`h-full transition-all duration-500 ${
                          getStepStatus(STEPS[index + 1].id) === "completed" ||
                          getStepStatus(STEPS[index + 1].id) === "current"
                            ? "bg-green-400"
                            : "bg-white/20"
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          {(purchasePlanMutation.isPending || submitChannelMutation.isPending) && (
            <div className="mt-4">
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-blue-400 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-fadeIn">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                <span className="text-red-600 text-sm font-bold">!</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 1: Select Plan */}
          {step === "select-plan" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h3>
                <p className="text-gray-600 mb-4">
                  Select a subscription plan to get started with YouTube growth
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <span className="text-sm text-gray-600">Available Balance:</span>
                  <span className="text-lg font-bold text-green-600">₦{userBalance.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {plans?.map((plan: any, index: number) => {
                  const planAmount = Number(plan.amount);
                  const totalCost = calculateTotalCost(planAmount);
                  const affordable = canAffordPlan(planAmount);
                  const isProcessing = purchasePlanMutation.isPending && selectedPlan === plan.id;
                  const isPremium = index >= 2;

                  return (
                    <div
                      key={plan.id}
                      className={`group relative border-2 rounded-2xl p-6 transition-all duration-300 ${
                        isProcessing
                          ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg scale-105"
                          : affordable
                          ? "border-gray-200 hover:border-red-400 hover:shadow-xl cursor-pointer transform hover:-translate-y-1"
                          : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                      } ${isPremium ? "bg-gradient-to-br from-purple-50 to-pink-50" : "bg-white"}`}
                      onClick={() => !isProcessing && affordable && handlePlanSelect(plan.id)}
                    >
                      {/* Premium Badge */}
                      {isPremium && affordable && (
                        <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full shadow-lg">
                          POPULAR
                        </div>
                      )}

                      <div className="space-y-4">
                        {/* Plan Header */}
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                          <p className="text-sm text-gray-600">{plan.description}</p>
                        </div>

                        {/* Subscriber Count */}
                        <div className="flex items-center gap-2 py-3 px-4 bg-blue-50 rounded-xl border border-blue-100">
                          <FiYoutube className="w-5 h-5 text-red-600" />
                          <div>
                            <p className="text-xs text-gray-600">Target Subscribers</p>
                            <p className="text-lg font-bold text-blue-600">
                              {plan.totalSub.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="space-y-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-gray-900">
                              ₦{planAmount.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-500">base price</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">VAT (7.5%)</span>
                            <span className="font-medium text-gray-700">
                              ₦{(planAmount * 0.075).toLocaleString()}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-gray-200 flex justify-between">
                            <span className="font-semibold text-gray-700">Total Cost</span>
                            <span className="text-xl font-bold text-green-600">
                              ₦{totalCost.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Action Button/Status */}
                        <div className="pt-2">
                          {isProcessing ? (
                            <div className="flex items-center justify-center gap-2 py-3 px-4 bg-green-100 text-green-700 rounded-xl">
                              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                              <span className="font-semibold">Processing Payment...</span>
                            </div>
                          ) : !affordable ? (
                            <div className="py-3 px-4 bg-red-100 text-red-700 text-center rounded-xl font-semibold">
                              Insufficient Balance
                            </div>
                          ) : (
                            <div className="py-3 px-4 bg-gradient-to-r from-red-600 to-pink-600 text-white text-center rounded-xl font-semibold group-hover:from-red-700 group-hover:to-pink-700 transition-all">
                              Select Plan
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
                💡 All plans include professional support and real subscriber growth
              </div>
            </div>
          )}

          {/* Step 2: Channel Form */}
          {step === "channel-form" && (
            <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Channel Details</h3>
                <p className="text-gray-600">
                  Enter your YouTube channel information to continue
                </p>
              </div>

              <div className="space-y-5">
                {/* Channel Name */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Channel Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="Enter your YouTube channel name"
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all group-hover:border-gray-300"
                  />
                </div>

                {/* Channel Link */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Channel Link <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={channelLink}
                    onChange={(e) => setChannelLink(e.target.value)}
                    placeholder="https://youtube.com/@yourchannel"
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all group-hover:border-gray-300"
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-gray-400 rounded-full" />
                    The full URL to your YouTube channel
                  </p>
                </div>

                {/* Channel Username */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Channel Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                      @
                    </span>
                    <input
                      type="text"
                      value={channelUrl}
                      onChange={(e) => setChannelUrl(e.target.value)}
                      placeholder="mychannel"
                      className="w-full pl-9 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all group-hover:border-gray-300"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-gray-400 rounded-full" />
                    DO NOT include the @ symbol (e.g., mychannel, not @mychannel)
                  </p>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <FiShield className="w-4 h-4" />
                  Important Information
                </h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <FiCheck className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                    <span>Make sure your channel information is accurate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiCheck className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                    <span>You'll receive a verification code in the next step</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiCheck className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                    <span>Verification typically takes 24-48 hours</span>
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitChannel}
                disabled={submitChannelMutation.isPending || !channelName || !channelUrl || !channelLink}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {submitChannelMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Channel...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Verification</span>
                    <FiCheck className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 3: Verification */}
          {step === "verification" && (
            <div className="space-y-8 animate-fadeIn max-w-2xl mx-auto">
              {/* Success Animation */}
              <div className="text-center">
                <div className="inline-flex p-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-2xl shadow-green-500/50 animate-bounce-slow mb-4">
                  <FiCheck className="w-16 h-16 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  Channel Submitted!
                </h3>
                <p className="text-gray-600 text-lg">
                  You're almost there. Just one more step to verify your channel.
                </p>
              </div>

              {/* Verification Code */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-8 shadow-inner">
                <p className="text-sm font-semibold text-gray-600 mb-3 text-center uppercase tracking-wide">
                  Your Verification Code
                </p>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <code className="text-3xl md:text-4xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600 tracking-wider">
                    {verificationCode}
                  </code>
                  <button
                    onClick={copyToClipboard}
                    className="group p-3 hover:bg-white rounded-xl transition-all hover:shadow-md"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <FiCheck className="w-6 h-6" />
                        <span className="text-sm font-medium">Copied!</span>
                      </div>
                    ) : (
                      <FiCopy className="w-6 h-6 text-gray-600 group-hover:text-red-600 transition-colors" />
                    )}
                  </button>
                </div>
                {copied && (
                  <p className="text-center text-sm text-green-600 font-medium animate-fadeIn">
                    ✓ Code copied to clipboard
                  </p>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
                <h4 className="font-bold text-blue-900 mb-4 text-lg flex items-center gap-2">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <FiFileText className="w-5 h-5 text-white" />
                  </div>
                  Next Steps - Complete Verification
                </h4>
                <ol className="space-y-4">
                  {[
                    { step: 1, text: "Copy the verification code above" },
                    { step: 2, text: "Go to your YouTube channel settings" },
                    { step: 3, text: "Add the code to your channel description" },
                    { step: 4, text: "Wait for admin verification (24-48 hours)" }
                  ].map((item) => (
                    <li key={item.step} className="flex items-start gap-3 group">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-110 transition-transform">
                        {item.step}
                      </div>
                      <span className="text-blue-900 pt-1 flex-1">{item.text}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Additional Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <FiShield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-yellow-900 mb-1">Important Reminder</h5>
                    <p className="text-sm text-yellow-800">
                      Do not remove the verification code from your channel description until your channel is approved. You'll receive a notification once verification is complete.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Done - I've Added the Code
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}