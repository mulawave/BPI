"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import {
  Mail, Users, Send, Filter, Monitor, Tablet, Smartphone,
  Upload, X, FileText, Image as ImageIcon, Check, AlertCircle,
  Settings, BarChart3, Loader2, CheckCircle, XCircle, Clock, Eye,
  Shield, Zap, Gauge, StopCircle, RotateCcw
} from "lucide-react";
import toast from "react-hot-toast";
import AdminPageGuide from "@/components/admin/AdminPageGuide";

type PreviewMode = "desktop" | "tablet" | "mobile";
type FilterType = "all" | "activated" | "non-activated" | "membership";
type SpamPreset = "conservative" | "moderate" | "aggressive";

const SPAM_PRESETS: Record<SpamPreset, { batchSize: number; delayBetweenEmailsMs: number; delayBetweenBatchesMs: number; warmUp: boolean; label: string; description: string; icon: typeof Shield }> = {
  conservative: {
    batchSize: 5,
    delayBetweenEmailsMs: 6000,
    delayBetweenBatchesMs: 90000,
    warmUp: true,
    label: "Conservative",
    description: "5 emails/batch · 6s between emails · 90s cooldown · Warm-up ON",
    icon: Shield,
  },
  moderate: {
    batchSize: 10,
    delayBetweenEmailsMs: 4000,
    delayBetweenBatchesMs: 45000,
    warmUp: true,
    label: "Moderate",
    description: "10 emails/batch · 4s between emails · 45s cooldown · Warm-up ON",
    icon: Gauge,
  },
  aggressive: {
    batchSize: 25,
    delayBetweenEmailsMs: 2000,
    delayBetweenBatchesMs: 15000,
    warmUp: false,
    label: "Fast",
    description: "25 emails/batch · 2s between emails · 15s cooldown · No warm-up",
    icon: Zap,
  },
};

export default function NewsletterPage() {
  const [step, setStep] = useState<"compose" | "sending" | "complete">("compose");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [membershipFilter, setMembershipFilter] = useState<string>("");
  const [fromEmail, setFromEmail] = useState("");
  const [replyToEmail, setReplyToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [embeddedImages, setEmbeddedImages] = useState<Array<{ id: string; file: File; position: number }>>([]);

  // Anti-spam send rate
  const [spamPreset, setSpamPreset] = useState<SpamPreset>("moderate");
  const [sendRate, setSendRate] = useState(SPAM_PRESETS.moderate);
  const [customMode, setCustomMode] = useState(false);

  // Job tracking
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState({ sent: 0, total: 0, failed: 0, currentBatch: 0, totalBatches: 0, status: "" as string, elapsedMs: 0, failedRecipients: [] as string[], lastError: null as string | null });

  const attachmentRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const { data: systemSettings } = api.admin.getSystemSettings.useQuery();
  const { data: membershipPackages } = api.admin.getPackages.useQuery({});
  const { data: recipientCount } = api.admin.getNewsletterRecipientCount.useQuery({
    filter: selectedFilter,
    membershipPackage: selectedFilter === "membership" ? membershipFilter : undefined
  });

  // Poll progress every 2s while job is running
  const progressQuery = api.admin.getNewsletterProgress.useQuery(
    { jobId: jobId || "" },
    { enabled: !!jobId && step === "sending", refetchInterval: 2000 }
  );

  useEffect(() => {
    if (progressQuery.data && progressQuery.data.status !== "not_found") {
      const d = progressQuery.data;
      setProgress({
        sent: d.sent,
        total: d.total,
        failed: d.failed,
        currentBatch: d.currentBatch,
        totalBatches: d.totalBatches,
        status: d.status,
        elapsedMs: d.elapsedMs,
        failedRecipients: d.failedRecipients,
        lastError: d.lastError,
      });
      if (d.status === "completed" || d.status === "error" || d.status === "cancelled") {
        setStep("complete");
      }
    }
  }, [progressQuery.data]);

  // Apply preset
  useEffect(() => {
    if (!customMode) {
      setSendRate(SPAM_PRESETS[spamPreset]);
    }
  }, [spamPreset, customMode]);

  const sendNewsletterMutation = api.admin.sendNewsletter.useMutation({
    onSuccess: (data) => {
      if (data.jobId) {
        setJobId(data.jobId);
        setProgress(p => ({ ...p, total: data.total, status: "running" }));
        toast.success(`Campaign started — ${data.total} recipients`);
      } else {
        toast.error(data.message || "No recipients");
        setStep("compose");
      }
    },
    onError: (error: any) => {
      toast.error(`Failed: ${error.message}`);
      setStep("compose");
    }
  });

  const cancelMutation = api.admin.cancelNewsletter.useMutation({
    onSuccess: () => toast.success("Campaign cancelled"),
    onError: (e: any) => toast.error(e.message),
  });

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ['pdf', 'jpg', 'jpeg', 'png'].includes(ext || '');
    });
    setAttachments([...attachments, ...validFiles]);
  };

  const handleImageEmbed = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file, idx) => ({
      id: crypto.randomUUID(),
      file,
      position: body.length + idx
    }));
    setEmbeddedImages([...embeddedImages, ...newImages]);
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body are required");
      return;
    }
    if ((recipientCount?.count || 0) === 0) {
      toast.error("No recipients match the selected filter");
      return;
    }

    setStep("sending");

    const attachmentData = await Promise.all(
      attachments.map(async (file) => ({
        filename: file.name,
        content: await fileToBase64(file),
      }))
    );

    const imageData = await Promise.all(
      embeddedImages.map(async (img) => ({
        id: img.id,
        content: await fileToBase64(img.file),
        position: img.position
      }))
    );

    sendNewsletterMutation.mutate({
      filter: selectedFilter,
      membershipPackage: selectedFilter === "membership" ? membershipFilter : undefined,
      fromEmail: fromEmail || undefined,
      replyToEmail: replyToEmail || undefined,
      subject,
      body,
      attachments: attachmentData,
      embeddedImages: imageData,
      sendRate: {
        batchSize: sendRate.batchSize,
        delayBetweenEmailsMs: sendRate.delayBetweenEmailsMs,
        delayBetweenBatchesMs: sendRate.delayBetweenBatchesMs,
        warmUp: sendRate.warmUp,
      },
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}m ${rem}s`;
  };

  const estimatedTime = useCallback(() => {
    const count = recipientCount?.count || 0;
    if (count === 0) return "—";
    const batches = Math.ceil(count / sendRate.batchSize);
    const emailTime = count * (sendRate.delayBetweenEmailsMs / 1000);
    const batchTime = Math.max(0, batches - 1) * (sendRate.delayBetweenBatchesMs / 1000);
    const totalSec = emailTime + batchTime;
    if (totalSec < 60) return `~${Math.round(totalSec)}s`;
    if (totalSec < 3600) return `~${Math.round(totalSec / 60)}min`;
    return `~${(totalSec / 3600).toFixed(1)}hr`;
  }, [recipientCount?.count, sendRate]);

  // ── COMPLETE SCREEN ──────────────────────────────────────────────
  if (step === "complete") {
    const successRate = progress.total > 0 ? Math.round((progress.sent / progress.total) * 100) : 0;
    const isCancelled = progress.status === "cancelled";
    const isError = progress.status === "error";

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8"
        >
          <div className="text-center mb-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isCancelled ? "bg-yellow-100 dark:bg-yellow-900/30" :
              isError ? "bg-red-100 dark:bg-red-900/30" :
              progress.failed > 0 ? "bg-orange-100 dark:bg-orange-900/30" :
              "bg-green-100 dark:bg-green-900/30"
            }`}>
              {isCancelled ? <StopCircle className="w-12 h-12 text-yellow-600" /> :
               isError ? <XCircle className="w-12 h-12 text-red-600" /> :
               progress.failed > 0 ? <AlertCircle className="w-12 h-12 text-orange-600" /> :
               <CheckCircle className="w-12 h-12 text-green-600" />}
            </div>
            <h2 className="text-2xl font-bold">
              {isCancelled ? "Campaign Cancelled" :
               isError ? "Campaign Error" :
               progress.failed > 0 ? "Campaign Completed with Errors" :
               "Campaign Sent Successfully!"}
            </h2>
            {progress.elapsedMs > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Duration: {formatDuration(progress.elapsedMs)}
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{progress.sent}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Sent</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Failed</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{progress.total}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{successRate}%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Success</div>
            </div>
          </div>

          {/* Failed recipients */}
          {progress.failedRecipients.length > 0 && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Failed Recipients ({progress.failedRecipients.length})
              </h4>
              <div className="max-h-32 overflow-y-auto text-xs text-red-600 dark:text-red-400 space-y-1">
                {progress.failedRecipients.map((email, i) => (
                  <div key={i} className="font-mono">{email}</div>
                ))}
              </div>
            </div>
          )}

          {/* Error message */}
          {progress.lastError && (
            <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-300">
              Last error: {progress.lastError}
            </div>
          )}

          <button
            onClick={() => {
              setStep("compose");
              setJobId(null);
              setSubject("");
              setBody("");
              setAttachments([]);
              setEmbeddedImages([]);
              setProgress({ sent: 0, total: 0, failed: 0, currentBatch: 0, totalBatches: 0, status: "", elapsedMs: 0, failedRecipients: [], lastError: null });
            }}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            New Campaign
          </button>
        </motion.div>
      </div>
    );
  }

  // ── SENDING SCREEN ──────────────────────────────────────────────
  if (step === "sending") {
    const pct = progress.total > 0 ? Math.round(((progress.sent + progress.failed) / progress.total) * 100) : 0;
    const isCancelled = progress.status === "cancelled";

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-6 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8"
        >
          <div className="text-center mb-6">
            {isCancelled ? (
              <>
                <StopCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Cancelling...</h2>
              </>
            ) : (
              <>
                <Loader2 className="w-16 h-16 animate-spin text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Sending Newsletter</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                  Batch {progress.currentBatch}/{progress.totalBatches} · {formatDuration(progress.elapsedMs)} elapsed
                </p>
              </>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-medium">
              <span>Progress</span>
              <span>{progress.sent + progress.failed} / {progress.total} ({pct}%)</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500 flex">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500"
                  style={{ width: `${progress.total > 0 ? (progress.sent / progress.total) * 100 : 0}%` }}
                />
                <div
                  className="bg-red-500 h-full transition-all duration-500"
                  style={{ width: `${progress.total > 0 ? (progress.failed / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-green-600">{progress.sent}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Sent</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-red-600">{progress.failed}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Failed</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                <div className="text-xl font-bold">{progress.total - progress.sent - progress.failed}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Remaining</div>
              </div>
            </div>

            {progress.lastError && (
              <div className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 rounded p-2 mt-2">
                Last error: {progress.lastError}
              </div>
            )}

            {/* Cancel button */}
            {!isCancelled && (
              <button
                onClick={() => {
                  if (jobId) cancelMutation.mutate({ jobId });
                }}
                className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <StopCircle className="w-5 h-5" />
                Cancel Campaign
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── COMPOSE SCREEN ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Newsletter Campaign</h1>
            <p className="text-gray-600 dark:text-gray-400">Send professional emails to your users</p>
          </div>
        </div>
      </motion.div>

      {/* User Guide */}
      <AdminPageGuide
        title="Newsletter Campaign Guide"
        sections={[
          {
            title: "Anti-Spam Delivery Strategy",
            icon: <Shield className="w-5 h-5 text-green-600" />,
            items: [
              "<strong>Conservative mode:</strong> 5 emails/batch, 6s gap, 90s cooldown — safest for new domains",
              "<strong>Moderate mode:</strong> 10 emails/batch, 4s gap, 45s cooldown — recommended default",
              "<strong>Fast mode:</strong> 25 emails/batch, 2s gap, 15s cooldown — for established senders",
              "<strong>Warm-up:</strong> First batch starts small (3 emails), then ramps up to full batch size",
              "<strong>Random jitter:</strong> Extra 0-2s random delay between emails to avoid pattern detection",
              "Emails are sent via a <strong>pooled SMTP connection</strong> for reliability and speed"
            ]
          },
          {
            title: "Creating a Campaign",
            icon: <FileText className="w-5 h-5 text-green-600" />,
            type: "ol",
            items: [
              "<strong>Select Recipients</strong> — filter by activation status or membership package",
              "<strong>Configure sender</strong> — From email and Reply-To (defaults to system settings)",
              "<strong>Compose content</strong> — Subject line + HTML body with embedded images",
              "<strong>Choose delivery speed</strong> — Pick a preset or customize for your SMTP provider",
              "<strong>Preview and send</strong> — Check all device sizes, then launch the campaign",
              "<strong>Track progress</strong> — Real-time polling shows sent/failed counts"
            ]
          },
          {
            title: "Best Practices to Avoid Spam Filters",
            icon: <AlertCircle className="w-5 h-5 text-orange-600" />,
            items: [
              "Use <strong>Conservative or Moderate</strong> mode for new sending domains",
              "Keep subject lines <strong>under 50 characters</strong> — avoid ALL CAPS and excessive punctuation",
              "Include a <strong>text-to-image ratio</strong> of at least 60% text to 40% images",
              "Avoid spam trigger words: <em>FREE, ACT NOW, URGENT, CLICK HERE, WINNER</em>",
              "Ensure your domain has <strong>SPF, DKIM, and DMARC</strong> records configured",
              "Always <strong>send a test email</strong> first to verify deliverability"
            ]
          }
        ]}
        features={[
          "Background processing (no timeout)",
          "Real-time progress polling",
          "Anti-spam delivery presets",
          "SMTP connection pooling",
          "Warm-up mode for new domains",
          "Random jitter anti-pattern",
          "Campaign cancellation",
          "Failed recipient tracking"
        ]}
        proTip="Start with <strong>Conservative mode</strong> if your domain is new or hasn't sent bulk email before. After successful campaigns, you can move to <strong>Moderate</strong>. The warm-up feature sends only 3 emails in the first batch to let recipient servers recognize your sender reputation."
        warning="Newsletter campaigns run in the background. You can <strong>navigate away</strong> and return later — progress is tracked server-side. Use <strong>Cancel</strong> to stop a running campaign."
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold">{recipientCount?.count || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Recipients</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-indigo-600" />
            <div>
              <div className="text-2xl font-bold">{estimatedTime()}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Est. Time</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-3">
            <Gauge className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold">{sendRate.batchSize}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Batch Size</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold capitalize">{spamPreset}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Speed Mode</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Composer */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Recipient Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-green-600" />
              Select Recipients
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "all", label: "All Users", icon: Users },
                  { value: "activated", label: "Activated Only", icon: CheckCircle },
                  { value: "non-activated", label: "Non-Activated", icon: XCircle },
                  { value: "membership", label: "By Membership", icon: Filter }
                ] as const).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setSelectedFilter(value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedFilter === value
                        ? "border-green-600 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-green-400"
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-xs font-medium">{label}</div>
                  </button>
                ))}
              </div>
              
              {selectedFilter === "membership" && (
                <select
                  value={membershipFilter}
                  onChange={(e) => setMembershipFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <option value="">Select Package</option>
                  {membershipPackages?.map((pkg: any) => (
                    <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                  ))}
                </select>
              )}
              
              <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                <Users className="w-4 h-4 inline mr-1" />
                {recipientCount?.count || 0} recipients selected
              </div>
            </div>
          </div>

          {/* Email Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">Email Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">From Email</label>
                <input
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder={systemSettings?.company_email?.value || "noreply@beepagro.com"}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reply-To Email</label>
                <input
                  type="email"
                  value={replyToEmail}
                  onChange={(e) => setReplyToEmail(e.target.value)}
                  placeholder={systemSettings?.support_email?.value || "support@beepagro.com"}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subject *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                  required
                />
              </div>
            </div>
          </div>

          {/* Message Body */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">Message Body *</h3>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message here... (Greeting will be added automatically)"
              rows={10}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg resize-none"
              required
            />
            
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => imageRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                Embed Image
              </button>
              <input
                ref={imageRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                multiple
                onChange={handleImageEmbed}
                className="hidden"
              />
              {embeddedImages.length > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400 py-2">
                  {embeddedImages.length} image(s) embedded
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Attachments
            </h3>
            <div
              onClick={() => attachmentRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 transition-colors"
            >
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">PDF, JPG, JPEG, PNG</p>
            </div>
            <input
              ref={attachmentRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              onChange={handleAttachmentUpload}
              className="hidden"
            />
            
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                    <button
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Anti-Spam Delivery Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Delivery Speed & Anti-Spam
            </h3>

            {/* Preset Selector */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {(Object.entries(SPAM_PRESETS) as [SpamPreset, typeof SPAM_PRESETS[SpamPreset]][]).map(([key, preset]) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={key}
                    onClick={() => { setSpamPreset(key); setCustomMode(false); }}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      spamPreset === key && !customMode
                        ? "border-green-600 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-green-400"
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-xs font-semibold">{preset.label}</div>
                  </button>
                );
              })}
            </div>

            {/* Current config summary */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Batch size:</span>
                  <span className="font-semibold">{sendRate.batchSize} emails</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email delay:</span>
                  <span className="font-semibold">{(sendRate.delayBetweenEmailsMs / 1000).toFixed(0)}s + jitter</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Batch cooldown:</span>
                  <span className="font-semibold">{(sendRate.delayBetweenBatchesMs / 1000).toFixed(0)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Warm-up:</span>
                  <span className={`font-semibold ${sendRate.warmUp ? "text-green-600" : "text-gray-400"}`}>
                    {sendRate.warmUp ? "ON" : "OFF"}
                  </span>
                </div>
              </div>
            </div>

            {/* Custom toggle */}
            <button
              onClick={() => setCustomMode(!customMode)}
              className="text-xs text-green-600 hover:text-green-700 font-medium mb-3"
            >
              {customMode ? "← Use presets" : "Custom settings →"}
            </button>

            {/* Custom controls */}
            <AnimatePresence>
              {customMode && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Batch Size</label>
                      <input
                        type="number"
                        value={sendRate.batchSize}
                        onChange={(e) => setSendRate({ ...sendRate, batchSize: Math.max(1, Math.min(50, parseInt(e.target.value) || 10)) })}
                        min="1" max="50"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Delay Between Emails (sec)</label>
                      <input
                        type="number"
                        value={Math.round(sendRate.delayBetweenEmailsMs / 1000)}
                        onChange={(e) => setSendRate({ ...sendRate, delayBetweenEmailsMs: Math.max(1, Math.min(30, parseInt(e.target.value) || 4)) * 1000 })}
                        min="1" max="30"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Batch Cooldown (sec)</label>
                      <input
                        type="number"
                        value={Math.round(sendRate.delayBetweenBatchesMs / 1000)}
                        onChange={(e) => setSendRate({ ...sendRate, delayBetweenBatchesMs: Math.max(5, Math.min(300, parseInt(e.target.value) || 45)) * 1000 })}
                        min="5" max="300"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sendRate.warmUp}
                          onChange={(e) => setSendRate({ ...sendRate, warmUp: e.target.checked })}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <span className="text-sm font-medium">Warm-up Mode</span>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              💡 <strong>Estimated delivery time:</strong> {estimatedTime()} for {recipientCount?.count || 0} recipients
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={sendNewsletterMutation.isPending || !subject.trim() || !body.trim() || (recipientCount?.count || 0) === 0}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sendNewsletterMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Starting Campaign...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Newsletter to {recipientCount?.count || 0} Recipients
              </>
            )}
          </button>
        </motion.div>

        {/* Right Panel - Live Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:sticky lg:top-6 h-fit"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-600" />
                Live Preview
              </h3>
              <div className="flex gap-2">
                {([
                  { mode: "desktop" as PreviewMode, icon: Monitor },
                  { mode: "tablet" as PreviewMode, icon: Tablet },
                  { mode: "mobile" as PreviewMode, icon: Smartphone }
                ]).map(({ mode, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setPreviewMode(mode)}
                    className={`p-2 rounded-lg transition-colors ${
                      previewMode === mode
                        ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
              <div
                className={`bg-white mx-auto transition-all ${
                  previewMode === "mobile" ? "max-w-sm" :
                  previewMode === "tablet" ? "max-w-md" :
                  "max-w-2xl"
                }`}
              >
                <EmailPreview
                  subject={subject}
                  body={body}
                  companyInfo={systemSettings}
                  embeddedImages={embeddedImages}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Email Preview Component
function EmailPreview({
  subject,
  body,
  companyInfo,
  embeddedImages
}: {
  subject: string;
  body: string;
  companyInfo: any;
  embeddedImages: Array<{ id: string; file: File; position: number }>;
}) {
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    embeddedImages.forEach(img => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrls(prev => ({ ...prev, [img.id]: e.target?.result as string }));
      };
      reader.readAsDataURL(img.file);
    });
  }, [embeddedImages]);

  return (
    <div className="font-sans">
      {/* Email Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white text-center">
        <img
          src="/img/logo.png"
          alt="BPI Logo"
          className="h-12 mx-auto mb-3"
        />
        <div className="text-sm opacity-90">Powering Palliative Through Technology</div>
      </div>

      {/* Email Body */}
      <div className="p-8">
        {subject && (
          <h2 className="text-2xl font-bold mb-6 text-gray-900">{subject}</h2>
        )}
        
        <div className="mb-4 text-gray-700">
          <p className="mb-4">Hello Richard,</p>
        </div>
        
        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {body || <span className="text-gray-400 italic">Your message will appear here...</span>}
        </div>

        {/* Embedded Images */}
        {embeddedImages.map(img => (
          <div key={img.id} className="my-4">
            {imageUrls[img.id] && (
              <img src={imageUrls[img.id]} alt="Embedded" className="max-w-full h-auto rounded-lg" />
            )}
          </div>
        ))}
      </div>

      {/* Email Footer */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white p-8 relative overflow-hidden" style={{ paddingTop: '4rem' }}>
        {/* Wave Effect */}
        <div className="absolute top-0 left-0 w-full" style={{ height: '60px', transform: 'translateY(-2px)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#ffffff"></path>
          </svg>
        </div>
        
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/img/logo.png" alt="BPI" className="h-8" />
            <div className="font-bold text-lg">BeepAgro Palliative Initiative</div>
          </div>
          
          <p className="text-center mb-3 opacity-95">Powering Palliative Through Technology</p>
          
          {companyInfo?.company_address?.value && (
            <p className="text-center mb-2 text-sm opacity-90">📍 {companyInfo.company_address.value}</p>
          )}
          {companyInfo?.company_phone?.value && (
            <p className="text-center mb-2 text-sm opacity-90">📞 {companyInfo.company_phone.value}</p>
          )}
          {companyInfo?.company_email?.value && (
            <p className="text-center mb-4 text-sm opacity-90">✉️ {companyInfo.company_email.value}</p>
          )}
          
          <div className="flex justify-center gap-3 mb-6 flex-wrap">
            {companyInfo?.social_facebook?.value && <a href={companyInfo.social_facebook.value} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors">Facebook</a>}
            {companyInfo?.social_twitter?.value && <a href={companyInfo.social_twitter.value} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors">Twitter</a>}
            {companyInfo?.social_instagram?.value && <a href={companyInfo.social_instagram.value} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors">Instagram</a>}
            {companyInfo?.social_linkedin?.value && <a href={companyInfo.social_linkedin.value} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors">LinkedIn</a>}
          </div>
          
          <div className="border-t border-white/30 pt-4 text-xs text-center opacity-80">
            <p className="mb-2">
              You are receiving this email because you signed up on BeepAgro Palliative Initiative.
            </p>
            <p className="mb-2">
              If you no longer wish to receive these emails, you can <a href="#" className="underline hover:text-white">unsubscribe here</a>.
            </p>
            <p className="mt-4">
              © {new Date().getFullYear()} BeepAgro Palliative Initiative. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
