"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Shield, User, MapPin, FileText, Camera, CheckCircle2,
  ChevronRight, ChevronLeft, Upload, AlertCircle, X,
  Loader2, Eye, BadgeCheck, Clock, XCircle, RefreshCw,
  Fingerprint, Calendar, Globe, Hash, Building2, FileImage,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────
type Step = "personal" | "address" | "document" | "selfie" | "review";

interface FormData {
  legalFirstName: string;
  legalLastName: string;
  dateOfBirth: string;
  nationality: string;
  gender: string;
  residentialAddress: string;
  residentialCity: string;
  residentialState: string;
  residentialCountry: string;
  residentialZip: string;
  documentType: "national_id" | "passport" | "drivers_license" | "voters_card";
  documentNumber: string;
  documentFrontUrl: string;
  documentBackUrl: string;
  documentExpiryDate: string;
  proofOfAddressUrl: string;
  proofOfAddressType: "utility_bill" | "bank_statement" | "tax_document" | "";
  selfieUrl: string;
  livenessCheckPassed: boolean;
  bvn: string;
  nin: string;
}

const STEPS: { key: Step; label: string; icon: typeof Shield }[] = [
  { key: "personal", label: "Personal Info", icon: User },
  { key: "address", label: "Address", icon: MapPin },
  { key: "document", label: "Document", icon: FileText },
  { key: "selfie", label: "Selfie & Biometric", icon: Camera },
  { key: "review", label: "Review & Submit", icon: CheckCircle2 },
];

const DOC_TYPE_LABELS: Record<string, string> = {
  national_id: "National ID Card",
  passport: "International Passport",
  drivers_license: "Driver's License",
  voters_card: "Voter's Card",
};

const PROOF_LABELS: Record<string, string> = {
  utility_bill: "Utility Bill",
  bank_statement: "Bank Statement",
  tax_document: "Tax Document",
};

// ── Main Component ────────────────────────────────────────────
export default function KycVerificationFlow() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // KYC status check
  const { data: kycStatus, isLoading: statusLoading } = api.kyc.getMyKycStatus.useQuery();
  const submitMutation = api.kyc.submitKyc.useMutation();

  const [currentStep, setCurrentStep] = useState<Step>("personal");
  const [formData, setFormData] = useState<FormData>({
    legalFirstName: "",
    legalLastName: "",
    dateOfBirth: "",
    nationality: "Nigerian",
    gender: "",
    residentialAddress: "",
    residentialCity: "",
    residentialState: "",
    residentialCountry: "Nigeria",
    residentialZip: "",
    documentType: "national_id",
    documentNumber: "",
    documentFrontUrl: "",
    documentBackUrl: "",
    documentExpiryDate: "",
    proofOfAddressUrl: "",
    proofOfAddressType: "",
    selfieUrl: "",
    livenessCheckPassed: false,
    bvn: "",
    nin: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  // ── Field update helper ─────────────────────────────────────
  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  // ── Validation ──────────────────────────────────────────────
  const validateStep = (step: Step): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};

    if (step === "personal") {
      if (!formData.legalFirstName.trim()) errs.legalFirstName = "First name is required";
      if (!formData.legalLastName.trim()) errs.legalLastName = "Last name is required";
      if (!formData.dateOfBirth) errs.dateOfBirth = "Date of birth is required";
      if (!formData.nationality.trim()) errs.nationality = "Nationality is required";
      // Age check (must be 18+)
      if (formData.dateOfBirth) {
        const age = Math.floor((Date.now() - new Date(formData.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 18) errs.dateOfBirth = "You must be at least 18 years old";
      }
    }

    if (step === "address") {
      if (!formData.residentialAddress.trim()) errs.residentialAddress = "Address is required";
      if (!formData.residentialCity.trim()) errs.residentialCity = "City is required";
      if (!formData.residentialState.trim()) errs.residentialState = "State is required";
      if (!formData.residentialCountry.trim()) errs.residentialCountry = "Country is required";
    }

    if (step === "document") {
      if (!formData.documentNumber.trim()) errs.documentNumber = "Document number is required";
      if (!formData.documentFrontUrl) errs.documentFrontUrl = "Front of document is required";
      if (formData.bvn && formData.bvn.length !== 11) errs.bvn = "BVN must be 11 digits";
      if (formData.nin && formData.nin.length !== 11) errs.nin = "NIN must be 11 digits";
    }

    if (step === "selfie") {
      if (!formData.selfieUrl) errs.selfieUrl = "A selfie photo is required for verification";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    const idx = STEPS.findIndex((s) => s.key === currentStep);
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1].key);
  };

  const prevStep = () => {
    const idx = STEPS.findIndex((s) => s.key === currentStep);
    if (idx > 0) setCurrentStep(STEPS[idx - 1].key);
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await submitMutation.mutateAsync({
        ...formData,
        proofOfAddressType: formData.proofOfAddressType || undefined,
        documentBackUrl: formData.documentBackUrl || undefined,
        proofOfAddressUrl: formData.proofOfAddressUrl || undefined,
        selfieUrl: formData.selfieUrl || undefined,
        documentExpiryDate: formData.documentExpiryDate || undefined,
        bvn: formData.bvn || undefined,
        nin: formData.nin || undefined,
        gender: formData.gender || undefined,
        residentialZip: formData.residentialZip || undefined,
      });

      toast.success("KYC submitted successfully! You will be notified once reviewed.");
      router.push("/dashboard");
    } catch (error: any) {
      // Parse tRPC/Zod validation errors into user-friendly messages
      let msg = "Failed to submit KYC. Please try again.";
      try {
        const parsed = JSON.parse(error?.message || "");
        if (Array.isArray(parsed)) {
          msg = parsed.map((e: any) => {
            const field = e.path?.join(".");
            const humanField = field
              ? field.replace(/Url$/, "").replace(/([A-Z])/g, " $1").trim()
              : "field";
            return e.message || `Invalid ${humanField}`;
          }).join(". ");
        }
      } catch {
        // Not JSON – use message as-is or fall back
        if (error?.message && !error.message.startsWith("[")) {
          msg = error.message;
        }
      }
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────
  if (statusLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
          <p className="text-slate-600 dark:text-slate-400">Loading verification status...</p>
        </div>
      </div>
    );
  }

  // ── Already submitted / status display ──────────────────────
  if (kycStatus?.status === "pending" || kycStatus?.status === "under_review") {
    return <KycStatusCard status={kycStatus.status} submission={kycStatus.submission} />;
  }

  if (kycStatus?.status === "approved" && kycStatus.submission?.expiresAt) {
    const expiresAt = new Date(kycStatus.submission.expiresAt);
    if (expiresAt > new Date()) {
      return <KycStatusCard status="approved" submission={kycStatus.submission} />;
    }
  }

  // If rejected or expired, allow resubmission (form shows)

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Page Title */}
      <div className="rounded-2xl bg-white shadow-lg ring-1 ring-slate-200/60 p-5 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Identity Verification</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Secure KYC Process</p>
          </div>
        </div>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            <X className="w-4 h-4 mr-1" /> Close
          </Button>
        </Link>
      </div>
      </div>

      {/* Rejection / Expiry notice */}
      {(kycStatus?.status === "rejected" || kycStatus?.status === "expired") && (
        <div className={`mx-auto max-w-4xl px-4 sm:px-6 mt-4`}>
          <div className={`rounded-xl p-4 border ${kycStatus.status === "rejected" ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50" : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50"}`}>
            <div className="flex items-start gap-3">
              {kycStatus.status === "rejected" ? (
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              ) : (
                <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className={`font-semibold ${kycStatus.status === "rejected" ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300"}`}>
                  {kycStatus.status === "rejected" ? "Previous Submission Rejected" : "Verification Expired"}
                </p>
                <p className="text-sm mt-1 text-slate-600 dark:text-slate-400">
                  {kycStatus.status === "rejected" && kycStatus.submission?.rejectionReason
                    ? `Reason: ${kycStatus.submission.rejectionReason}`
                    : "Please resubmit your documents to maintain access."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Stepper */}
      <div className="rounded-2xl bg-white shadow-lg ring-1 ring-slate-200/60 p-5 mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === stepIndex;
            const isCompleted = i < stepIndex;

            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isCompleted
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                        : isActive
                        ? "bg-white dark:bg-slate-800 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/20"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400"
                    }`}
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </motion.div>
                  <span className={`mt-2 text-xs font-medium hidden sm:block ${isActive ? "text-emerald-600 dark:text-emerald-400" : isCompleted ? "text-emerald-500" : "text-slate-400 dark:text-slate-500"}`}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300 ${isCompleted ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-2xl bg-white shadow-lg ring-1 ring-slate-200/60 p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {currentStep === "personal" && (
              <PersonalInfoStep formData={formData} errors={errors} updateField={updateField} />
            )}
            {currentStep === "address" && (
              <AddressStep formData={formData} errors={errors} updateField={updateField} />
            )}
            {currentStep === "document" && (
              <DocumentStep formData={formData} errors={errors} updateField={updateField} />
            )}
            {currentStep === "selfie" && (
              <SelfieStep formData={formData} errors={errors} updateField={updateField} />
            )}
            {currentStep === "review" && (
              <ReviewStep formData={formData} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200/60 dark:border-emerald-800/40 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={stepIndex === 0}
            className="gap-2 border-slate-300 dark:border-slate-600"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>

          <span className="text-sm text-slate-500 dark:text-slate-400">
            Step {stepIndex + 1} of {STEPS.length}
          </span>

          {currentStep === "review" ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isSubmitting ? "Submitting..." : "Submit Verification"}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              className="gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step Components ───────────────────────────────────────────

interface StepProps {
  formData: FormData;
  errors: Partial<Record<keyof FormData, string>>;
  updateField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}

function PersonalInfoStep({ formData, errors, updateField }: StepProps) {
  return (
    <div className="space-y-6">
      <StepHeader
        icon={User}
        title="Personal Information"
        description="Enter your legal name exactly as it appears on your identity document."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="Legal First Name"
          value={formData.legalFirstName}
          onChange={(v) => updateField("legalFirstName", v)}
          error={errors.legalFirstName}
          placeholder="Enter your first name"
          icon={User}
        />
        <InputField
          label="Legal Last Name"
          value={formData.legalLastName}
          onChange={(v) => updateField("legalLastName", v)}
          error={errors.legalLastName}
          placeholder="Enter your last name"
          icon={User}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="Date of Birth"
          value={formData.dateOfBirth}
          onChange={(v) => updateField("dateOfBirth", v)}
          error={errors.dateOfBirth}
          type="date"
          icon={Calendar}
        />
        <SelectField
          label="Gender"
          value={formData.gender}
          onChange={(v) => updateField("gender", v)}
          options={[
            { value: "", label: "Select gender" },
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
        />
      </div>

      <InputField
        label="Nationality"
        value={formData.nationality}
        onChange={(v) => updateField("nationality", v)}
        error={errors.nationality}
        placeholder="e.g., Nigerian"
        icon={Globe}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="BVN (Bank Verification Number)"
          value={formData.bvn}
          onChange={(v) => updateField("bvn", v.replace(/\D/g, "").slice(0, 11))}
          error={errors.bvn}
          placeholder="11-digit BVN"
          icon={Fingerprint}
          hint="Optional but recommended for faster verification"
        />
        <InputField
          label="NIN (National Identification Number)"
          value={formData.nin}
          onChange={(v) => updateField("nin", v.replace(/\D/g, "").slice(0, 11))}
          error={errors.nin}
          placeholder="11-digit NIN"
          icon={Hash}
          hint="Optional but recommended"
        />
      </div>
    </div>
  );
}

function AddressStep({ formData, errors, updateField }: StepProps) {
  return (
    <div className="space-y-6">
      <StepHeader
        icon={MapPin}
        title="Residential Address"
        description="Provide your current residential address for verification."
      />

      <InputField
        label="Street Address"
        value={formData.residentialAddress}
        onChange={(v) => updateField("residentialAddress", v)}
        error={errors.residentialAddress}
        placeholder="e.g., 12 Admiralty Way, Lekki Phase 1"
        icon={Building2}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="City"
          value={formData.residentialCity}
          onChange={(v) => updateField("residentialCity", v)}
          error={errors.residentialCity}
          placeholder="e.g., Lagos"
          icon={MapPin}
        />
        <InputField
          label="State / Province"
          value={formData.residentialState}
          onChange={(v) => updateField("residentialState", v)}
          error={errors.residentialState}
          placeholder="e.g., Lagos"
          icon={MapPin}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="Country"
          value={formData.residentialCountry}
          onChange={(v) => updateField("residentialCountry", v)}
          error={errors.residentialCountry}
          placeholder="e.g., Nigeria"
          icon={Globe}
        />
        <InputField
          label="Postal / ZIP Code"
          value={formData.residentialZip}
          onChange={(v) => updateField("residentialZip", v)}
          error={errors.residentialZip}
          placeholder="Optional"
          icon={Hash}
        />
      </div>

      {/* Proof of Address Upload */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Proof of Address (Optional)</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Upload a utility bill, bank statement, or tax document not older than 3 months.</p>
        <SelectField
          label="Document Type"
          value={formData.proofOfAddressType}
          onChange={(v) => updateField("proofOfAddressType", v as any)}
          options={[
            { value: "", label: "Select type..." },
            { value: "utility_bill", label: "Utility Bill" },
            { value: "bank_statement", label: "Bank Statement" },
            { value: "tax_document", label: "Tax Document" },
          ]}
        />
        {formData.proofOfAddressType && (
          <div className="mt-3">
            <FileUploadField
              label="Upload Proof of Address"
              value={formData.proofOfAddressUrl}
              onChange={(v) => updateField("proofOfAddressUrl", v)}
              docType="proof_of_address"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentStep({ formData, errors, updateField }: StepProps) {
  return (
    <div className="space-y-6">
      <StepHeader
        icon={FileText}
        title="Identity Document"
        description="Upload a clear photo of a valid government-issued identity document."
      />

      <SelectField
        label="Document Type"
        value={formData.documentType}
        onChange={(v) => updateField("documentType", v as any)}
        options={[
          { value: "national_id", label: "National ID Card (NIN Slip / Card)" },
          { value: "passport", label: "International Passport" },
          { value: "drivers_license", label: "Driver's License" },
          { value: "voters_card", label: "Voter's Card (PVC)" },
        ]}
      />

      <InputField
        label="Document Number"
        value={formData.documentNumber}
        onChange={(v) => updateField("documentNumber", v)}
        error={errors.documentNumber}
        placeholder="Enter the document ID number"
        icon={Hash}
      />

      <InputField
        label="Document Expiry Date"
        value={formData.documentExpiryDate}
        onChange={(v) => updateField("documentExpiryDate", v)}
        error={errors.documentExpiryDate}
        type="date"
        icon={Calendar}
        hint="Leave blank if the document does not expire"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FileUploadField
          label="Front of Document"
          value={formData.documentFrontUrl}
          onChange={(v) => updateField("documentFrontUrl", v)}
          error={errors.documentFrontUrl}
          docType="front"
          required
        />
        <FileUploadField
          label="Back of Document"
          value={formData.documentBackUrl}
          onChange={(v) => updateField("documentBackUrl", v)}
          docType="back"
        />
      </div>

      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-semibold mb-1">Document Guidelines</p>
            <ul className="list-disc ml-4 space-y-1 text-xs text-blue-600 dark:text-blue-400">
              <li>Ensure the entire document is visible and well-lit</li>
              <li>All text and photo must be clearly legible</li>
              <li>Do not crop or edit the document image</li>
              <li>Accepted formats: JPEG, PNG, WebP, PDF (max 10MB)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelfieStep({ formData, errors, updateField }: StepProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string>(formData.selfieUrl || "");
  const [isUploading, setIsUploading] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setCameraActive(true);
    } catch {
      toast.error("Unable to access camera. Please allow camera permissions or upload a selfie instead.");
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    stopCamera();

    // Convert canvas to blob and upload
    setIsUploading(true);
    try {
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9)
      );
      const fd = new FormData();
      fd.append("file", blob, "selfie.jpg");
      fd.append("type", "selfie");

      const res = await fetch("/api/upload/kyc", { method: "POST", body: fd });
      const data = await res.json();

      if (data.success && data.imageUrl) {
        setCapturedImage(data.imageUrl);
        updateField("selfieUrl", data.imageUrl);
        updateField("livenessCheckPassed", true);
        toast.success("Selfie captured successfully!");
      } else {
        toast.error(data.error || "Failed to upload selfie.");
      }
    } catch {
      toast.error("Failed to upload selfie. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const retake = () => {
    setCapturedImage("");
    updateField("selfieUrl", "");
    updateField("livenessCheckPassed", false);
  };

  return (
    <div className="space-y-6">
      <StepHeader
        icon={Camera}
        title="Selfie & Biometric Verification"
        description="Take a clear selfie for identity matching. Ensure good lighting and face the camera directly."
      />

      <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
        {!cameraActive && !capturedImage && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6">
              <Camera className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Take a Selfie</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm mb-6">
              Use your device camera to take a live photo. This helps us verify your identity matches your documents.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={startCamera}
                className="gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
              >
                <Camera className="w-4 h-4" /> Open Camera
              </Button>
              <FileUploadField
                label=""
                value=""
                onChange={(url) => {
                  setCapturedImage(url);
                  updateField("selfieUrl", url);
                  updateField("livenessCheckPassed", false);
                }}
                docType="selfie"
                buttonMode
              />
            </div>
          </div>
        )}

        {cameraActive && (
          <div className="relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-[400px] object-cover" />
            {/* Face guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-72 border-4 border-white/50 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]" />
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <Button
                onClick={capturePhoto}
                disabled={isUploading}
                className="gap-2 bg-white text-slate-900 hover:bg-slate-100 shadow-xl"
                size="lg"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                Capture
              </Button>
              <Button
                onClick={stopCamera}
                variant="outline"
                className="gap-2 bg-white/20 backdrop-blur text-white border-white/50 hover:bg-white/30"
              >
                <X className="w-4 h-4" /> Cancel
              </Button>
            </div>
          </div>
        )}

        {capturedImage && !cameraActive && (
          <div className="relative">
            <img src={capturedImage} alt="Selfie" className="w-full max-h-[400px] object-cover" />
            <div className="absolute top-3 right-3">
              <Button onClick={retake} variant="outline" size="sm" className="gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur">
                <RefreshCw className="w-3 h-3" /> Retake
              </Button>
            </div>
            <div className="absolute bottom-3 left-3 bg-emerald-500/90 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> Photo captured
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {errors.selfieUrl && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" /> {errors.selfieUrl}
        </p>
      )}

      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-700 dark:text-amber-300">
            <p className="font-semibold mb-1">Tips for a good selfie</p>
            <ul className="list-disc ml-4 space-y-1 text-xs text-amber-600 dark:text-amber-400">
              <li>Look directly at the camera</li>
              <li>Ensure even lighting on your face</li>
              <li>Remove glasses, hats, or face coverings</li>
              <li>Keep a neutral expression</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ formData }: { formData: FormData }) {
  return (
    <div className="space-y-6">
      <StepHeader
        icon={CheckCircle2}
        title="Review Your Information"
        description="Please review all details carefully before submitting. You can go back to edit any section."
      />

      {/* Personal Info Review */}
      <ReviewSection title="Personal Information" icon={User}>
        <ReviewRow label="Full Name" value={`${formData.legalFirstName} ${formData.legalLastName}`} />
        <ReviewRow label="Date of Birth" value={formData.dateOfBirth} />
        <ReviewRow label="Gender" value={formData.gender || "Not specified"} />
        <ReviewRow label="Nationality" value={formData.nationality} />
        {formData.bvn && <ReviewRow label="BVN" value={`${"*".repeat(7)}${formData.bvn.slice(-4)}`} />}
        {formData.nin && <ReviewRow label="NIN" value={`${"*".repeat(7)}${formData.nin.slice(-4)}`} />}
      </ReviewSection>

      {/* Address Review */}
      <ReviewSection title="Address" icon={MapPin}>
        <ReviewRow label="Street" value={formData.residentialAddress} />
        <ReviewRow label="City / State" value={`${formData.residentialCity}, ${formData.residentialState}`} />
        <ReviewRow label="Country" value={formData.residentialCountry} />
        {formData.residentialZip && <ReviewRow label="Postal Code" value={formData.residentialZip} />}
        {formData.proofOfAddressType && (
          <ReviewRow label="Proof of Address" value={PROOF_LABELS[formData.proofOfAddressType] || formData.proofOfAddressType} />
        )}
      </ReviewSection>

      {/* Document Review */}
      <ReviewSection title="Identity Document" icon={FileText}>
        <ReviewRow label="Type" value={DOC_TYPE_LABELS[formData.documentType] || formData.documentType} />
        <ReviewRow label="Number" value={formData.documentNumber} />
        {formData.documentExpiryDate && <ReviewRow label="Expiry" value={formData.documentExpiryDate} />}
        <div className="flex gap-3 mt-3">
          {formData.documentFrontUrl && (
            <div className="w-24 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              <img src={formData.documentFrontUrl} alt="Front" className="w-full h-full object-cover" />
            </div>
          )}
          {formData.documentBackUrl && (
            <div className="w-24 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              <img src={formData.documentBackUrl} alt="Back" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </ReviewSection>

      {/* Selfie Review */}
      <ReviewSection title="Selfie" icon={Camera}>
        {formData.selfieUrl ? (
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500">
            <img src={formData.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
          </div>
        ) : (
          <p className="text-sm text-slate-500">No selfie provided</p>
        )}
      </ReviewSection>

      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-700 dark:text-emerald-300">
            <p className="font-semibold mb-1">Data Security</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Your personal data is encrypted and stored securely. It will only be used for identity verification purposes
              and handled in accordance with applicable data protection regulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── KYC Status Card (shown when already submitted) ────────────
function KycStatusCard({ status, submission }: { status: string; submission: any }) {
  const router = useRouter();

  const config = {
    pending: {
      icon: Clock,
      color: "amber",
      title: "KYC Under Review",
      message: "Your identity documents have been submitted and are being reviewed. This usually takes 24–48 hours.",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800/50",
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    under_review: {
      icon: Eye,
      color: "blue",
      title: "KYC Being Reviewed",
      message: "An admin is actively reviewing your submission. You will be notified once a decision is made.",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800/50",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    approved: {
      icon: BadgeCheck,
      color: "emerald",
      title: "Identity Verified",
      message: "Your identity has been verified. Your account is fully verified.",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800/50",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
  }[status] || {
    icon: Clock,
    color: "slate",
    title: "KYC Status",
    message: "Check your KYC status.",
    bg: "bg-slate-50 dark:bg-slate-950/30",
    border: "border-slate-200 dark:border-slate-800/50",
    iconBg: "bg-slate-100 dark:bg-slate-900/30",
    iconColor: "text-slate-600 dark:text-slate-400",
  };

  const Icon = config.icon;

  return (
    <div className="flex items-center justify-center py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`max-w-md w-full rounded-2xl border ${config.border} bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-xl ring-1 ring-amber-300/10 p-8 text-center`}
      >
        <div className={`w-20 h-20 rounded-full ${config.iconBg} flex items-center justify-center mx-auto mb-6`}>
          <Icon className={`w-10 h-10 ${config.iconColor}`} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{config.title}</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{config.message}</p>

        {submission?.submittedAt && (
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-4">
            Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
          </p>
        )}

        {status === "approved" && submission?.expiresAt && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-4">
            Valid until: {new Date(submission.expiresAt).toLocaleDateString()}
          </p>
        )}

        <Button
          onClick={() => router.push("/dashboard")}
          className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
        >
          Back to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}

// ── Shared UI Components ──────────────────────────────────────

function StepHeader({ icon: Icon, title, description }: { icon: typeof Shield; title: string; description: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 ml-11">{description}</p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  icon?: typeof Shield;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border ${error ? "border-red-300 dark:border-red-700" : "border-slate-300 dark:border-slate-600"} bg-white dark:bg-slate-800 ${Icon ? "pl-10" : "pl-4"} pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 transition-colors`}
        />
      </div>
      {hint && !error && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FileUploadField({
  label,
  value,
  onChange,
  error,
  docType,
  required,
  buttonMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  docType: string;
  required?: boolean;
  buttonMode?: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", docType);
      const res = await fetch("/api/upload/kyc", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        onChange(data.imageUrl);
        toast.success(`${label || "File"} uploaded successfully!`);
      } else {
        toast.error(data.error || "Upload failed.");
      }
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (buttonMode) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="gap-2"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Upload Photo
        </Button>
      </>
    );
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <img src={value} alt={label} className="w-full h-32 object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-2 bg-emerald-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Uploaded
          </div>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed ${error ? "border-red-300 dark:border-red-700" : "border-slate-300 dark:border-slate-600"} bg-slate-50 dark:bg-slate-800/50 py-8 px-4 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors`}>
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
          ) : (
            <FileImage className="w-8 h-8 text-slate-400 mb-2" />
          )}
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {isUploading ? "Uploading..." : "Click to upload"}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">JPEG, PNG, WebP, PDF up to 10MB</span>
        </label>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

function ReviewSection({ title, icon: Icon, children }: { title: string; icon: typeof Shield; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10 p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <Icon className="w-4 h-4 text-emerald-500" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}
