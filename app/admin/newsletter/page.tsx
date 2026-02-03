"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import {
  Mail, Users, Send, Filter, Monitor, Tablet, Smartphone,
  Upload, X, FileText, Image as ImageIcon, Check, AlertCircle,
  Settings, BarChart3, Loader2, CheckCircle, XCircle, Clock, Eye
} from "lucide-react";
import toast from "react-hot-toast";
import AdminPageGuide from "@/components/admin/AdminPageGuide";

type PreviewMode = "desktop" | "tablet" | "mobile";
type FilterType = "all" | "activated" | "non-activated" | "membership";

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
  const [sendRate, setSendRate] = useState({ emails: 50, interval: 10 });
  const [sending, setSending] = useState(false);
  const [paused, setPaused] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0, failed: 0 });

  const attachmentRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const { data: systemSettings } = api.admin.getSystemSettings.useQuery();
  const { data: membershipPackages } = api.admin.getPackages.useQuery({});
  const { data: recipientCount } = api.admin.getNewsletterRecipientCount.useQuery({
    filter: selectedFilter,
    membershipPackage: selectedFilter === "membership" ? membershipFilter : undefined
  });

  const sendNewsletterMutation = api.admin.sendNewsletter.useMutation({
    onSuccess: (data: { sent: number; failed: number; total: number }) => {
      setProgress({ sent: data.sent, total: data.total, failed: data.failed });
      setStep("complete");
      toast.success(`Newsletter sent to ${data.sent} recipients`);
    },
    onError: (error: any) => {
      toast.error(`Failed to send newsletter: ${error.message}`);
      setSending(false);
    }
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

    setSending(true);
    setStep("sending");

    // Convert files to base64
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
      fromEmail,
      replyToEmail,
      subject,
      body,
      attachments: attachmentData,
      embeddedImages: imageData,
      sendRate
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

  if (step === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Newsletter Sent Successfully!</h2>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600">{progress.sent}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Sent</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-3xl font-bold">{progress.total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="text-3xl font-bold text-red-600">{progress.failed}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
            </div>
          </div>
          <button
            onClick={() => {
              setStep("compose");
              setSubject("");
              setBody("");
              setAttachments([]);
              setEmbeddedImages([]);
              setProgress({ sent: 0, total: 0, failed: 0 });
            }}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-lg hover:shadow-lg transition-all"
          >
            Send Another Newsletter
          </button>
        </motion.div>
      </div>
    );
  }

  if (step === "sending") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-6 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8"
        >
          <div className="text-center mb-6">
            {cancelled ? (
              <>
                <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Sending Cancelled</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Newsletter sending was stopped
                </p>
              </>
            ) : paused ? (
              <>
                <Clock className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Sending Paused</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Click resume to continue sending
                </p>
              </>
            ) : (
              <>
                <Loader2 className="w-16 h-16 animate-spin text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Sending Newsletter...</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Sending {sendRate.emails} emails every {sendRate.interval} minutes
                </p>
              </>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress.sent} / {progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-600 to-emerald-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress.total > 0 ? (progress.sent / progress.total) * 100 : 0}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{progress.sent}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Successfully Sent</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Failed</div>
              </div>
            </div>
            
            {/* Control Buttons */}
            <div className="flex gap-3 mt-6">
              {!cancelled && !paused && (
                <button
                  onClick={() => setPaused(true)}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Clock className="w-5 h-5" />
                  Pause
                </button>
              )}
              {paused && !cancelled && (
                <button
                  onClick={() => setPaused(false)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Resume
                </button>
              )}
              {!cancelled && (
                <button
                  onClick={() => {
                    setCancelled(true);
                    setPaused(false);
                    setTimeout(() => setStep('complete'), 2000);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Cancel
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

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
            title: "Newsletter System Overview",
            icon: <Mail className="w-5 h-5 text-blue-600" />,
            items: [
              "Send <strong>professional HTML emails</strong> to all users or targeted segments",
              "<strong>Attach files</strong> (PDF, images) or <strong>embed images</strong> in email body",
              "<strong>Preview emails</strong> on desktop, tablet, and mobile devices",
              "<strong>Throttle sending rate</strong> to avoid spam filters (50 emails/10 seconds default)",
              "Track <strong>send progress</strong> in real-time with success/failure counts"
            ]
          },
          {
            title: "Creating a Newsletter Campaign",
            icon: <FileText className="w-5 h-5 text-green-600" />,
            type: "ol",
            items: [
              "<strong>Select Recipients</strong> - Choose All Users, Activated Only, Non-Activated, or By Membership",
              "<strong>Set sender details</strong> - From email (uses system default if empty), Reply-To email",
              "<strong>Compose subject</strong> - Clear, compelling subject line (avoid spam trigger words)",
              "<strong>Write email body</strong> - Use HTML formatting, personalization tokens, professional tone",
              "<strong>Add attachments</strong> - PDF, JPG, JPEG, PNG files (optional)",
              "<strong>Embed images</strong> - Insert images directly in email body (optional)",
              "<strong>Preview</strong> - Check desktop/tablet/mobile views before sending",
              "<strong>Send campaign</strong> - Click Send to start throttled distribution"
            ]
          },
          {
            title: "Recipient Filtering",
            icon: <Filter className="w-5 h-5 text-orange-600" />,
            items: [
              "<strong>All Users</strong> - Send to entire user base (highest reach)",
              "<strong>Activated Only</strong> - Target users who completed account activation",
              "<strong>Non-Activated</strong> - Re-engage users who haven't activated yet",
              "<strong>By Membership</strong> - Filter by specific membership package (Freemium, Premium, Enterprise)",
              "Recipient count updates <strong>live</strong> as you change filters",
              "Zero recipients? Check filter selection and user database"
            ]
          },
          {
            title: "Email Delivery & Throttling",
            icon: <Send className="w-5 h-5 text-purple-600" />,
            items: [
              "<strong>Default rate:</strong> 50 emails every 10 seconds (300/minute)",
              "Throttling prevents <strong>spam filter triggers</strong> and IP blacklisting",
              "<strong>Monitor progress</strong> - Live updates show sent/failed/total counts",
              "<strong>Pause/Resume</strong> - Control sending if needed (feature in UI)",
              "<strong>Failed emails</strong> tracked separately - review for invalid addresses",
              "Large campaigns (1000+ users) may take several minutes"
            ]
          },
          {
            title: "Best Practices",
            icon: <Settings className="w-5 h-5 text-blue-600" />,
            items: [
              "<strong>Subject lines:</strong> Keep under 50 characters for mobile visibility",
              "<strong>Preview text:</strong> First 100 characters show in inbox - make them count",
              "<strong>HTML formatting:</strong> Use semantic HTML, avoid excessive images",
              "<strong>Attachments:</strong> Limit to 2-3 files, keep total size under 5MB",
              "<strong>Testing:</strong> Send test email to yourself before full campaign",
              "<strong>Timing:</strong> Send during business hours for higher open rates",
              "<strong>Mobile-first:</strong> 60%+ users read on mobile - always preview mobile view"
            ]
          }
        ]}
        features={[
          "Segment recipient targeting",
          "HTML email composer",
          "File attachments & image embedding",
          "Multi-device preview (desktop/tablet/mobile)",
          "Throttled sending (spam prevention)",
          "Real-time progress tracking",
          "Success/failure analytics",
          "Membership-based filtering"
        ]}
        proTip="To <strong>maximize open rates</strong>, send newsletters on <strong>Tuesday-Thursday between 10 AM - 2 PM</strong>. Use <strong>personalized subject lines</strong> and keep emails under <strong>500 words</strong>. Always send a <strong>test email to yourself</strong> first to catch formatting issues!"
        warning="Newsletter campaigns are <strong>sent immediately</strong> and cannot be recalled once started. Always <strong>preview all device sizes</strong> and <strong>verify recipient count</strong> before clicking Send. Typos, broken links, or wrong recipients can damage credibility."
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
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold">{progress.sent}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Sent Today</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-600" />
            <div>
              <div className="text-2xl font-bold">{progress.failed}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold">
                {progress.total > 0 ? Math.round((progress.sent / progress.total) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
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
                {[
                  { value: "all", label: "All Users", icon: Users },
                  { value: "activated", label: "Activated Only", icon: CheckCircle },
                  { value: "non-activated", label: "Non-Activated", icon: XCircle },
                  { value: "membership", label: "By Membership", icon: Filter }
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setSelectedFilter(value as FilterType)}
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
            
            {/* Image Embed Button */}
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

          {/* Send Rate Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              Send Rate Limiting
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Emails per Batch</label>
                <input
                  type="number"
                  value={sendRate.emails}
                  onChange={(e) => setSendRate({ ...sendRate, emails: parseInt(e.target.value) || 50 })}
                  min="1"
                  max="100"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Interval (minutes)</label>
                <input
                  type="number"
                  value={sendRate.interval}
                  onChange={(e) => setSendRate({ ...sendRate, interval: parseInt(e.target.value) || 10 })}
                  min="1"
                  max="60"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              💡 Recommended: 50 emails every 10 minutes to avoid SMTP throttling
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim() || (recipientCount?.count || 0) === 0}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
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
                {[
                  { mode: "desktop" as PreviewMode, icon: Monitor },
                  { mode: "tablet" as PreviewMode, icon: Tablet },
                  { mode: "mobile" as PreviewMode, icon: Smartphone }
                ].map(({ mode, icon: Icon }) => (
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
            
            {/* Email Preview with Responsive Container */}
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
            <div className="font-bold text-lg">BeepAgro Progress Initiative</div>
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
              You are receiving this email because you signed up on BeepAgro Progress Initiative.
            </p>
            <p className="mb-2">
              If you no longer wish to receive these emails, you can <a href="#" className="underline hover:text-white">unsubscribe here</a>.
            </p>
            <p className="mt-4">
              © {new Date().getFullYear()} BeepAgro Progress Initiative. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
