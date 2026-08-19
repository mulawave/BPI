"use client";
import { useState, useRef } from "react";
import { api } from "@/client/trpc";
import { User, Camera, Check, X, Edit, Settings, Crown, Award, Mail, Phone, MapPin } from "lucide-react";
import { checkProfileCompletion } from "@/lib/profile-completion";
import { LocationCascadeField } from "@/components/profile/LocationCascadeField";
import { BankDetailsField } from "@/components/profile/BankDetailsFieldEnhanced";
import Link from "next/link";

interface Props {
  session: any;
  userProfile: any;
  communityStats: any;
  totalTaxes: number;
  formatAmount: (n: number) => string;
  isImpersonating: boolean;
  needsActivation: boolean;
  onShowCommunityStats?: () => void;
  onShowTaxes?: () => void;
}

export function PremiumProfileCard({ session, userProfile, communityStats, totalTaxes, formatAmount, isImpersonating, needsActivation, onShowCommunityStats, onShowTaxes }: Props) {
  const ud = userProfile as any;
  const utils = api.useUtils();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [alertState, setAlertState] = useState<{ show: boolean; type: "success" | "warning" | "error"; message: string }>({ show: false, type: "success", message: "" });

  const handleUpdateStatus = (status: "loading" | "success" | "error", message: string) => {
    if (status === "loading") setAlertState({ show: true, type: "warning", message });
    else if (status === "success") { setAlertState({ show: true, type: "success", message }); setTimeout(() => setAlertState(p => ({ ...p, show: false })), 3000); }
    else setAlertState({ show: true, type: "error", message });
  };
  const dismissAlert = () => setAlertState(p => ({ ...p, show: false }));

  const pc = checkProfileCompletion({ firstname: ud?.firstname, lastname: ud?.lastname, email: ud?.email, mobile: ud?.mobile, address: ud?.address, city: ud?.city, state: ud?.state, country: ud?.country, gender: ud?.gender, image: ud?.image });
  const isProfileComplete = pc.isComplete;
  const mN = ud?.activeMembership?.name ?? "No Membership";
  const tN = ud?.rank ?? "—";
  const pI = ud?.image || ud?.profilePic || null;
  const showOverlay = !isImpersonating && !!ud && !needsActivation && !isProfileComplete;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!["image/jpeg","image/jpg","image/png","image/gif","image/webp"].includes(file.type)) { handleUpdateStatus("error", "Invalid file type."); return; }
    if (file.size > 5e6) { handleUpdateStatus("error", "File too large. Max 5MB."); return; }
    setIsUploading(true); setUploadProgress(0);
    try {
      const fd = new FormData(); fd.append("avatar", file);
      const pi = setInterval(() => setUploadProgress(p => { if (p >= 90) { clearInterval(pi); return 90; } return p + 10; }), 200);
      const r = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      clearInterval(pi);
      if (!r.ok) { const er = await r.json(); throw new Error(er.error || "Upload failed"); }
      setUploadProgress(100); handleUpdateStatus("success", "Avatar uploaded!"); setAvatarLoadError(false);
      await utils.user.getDetails.invalidate();
      setTimeout(() => { setIsUploading(false); setUploadProgress(0); }, 1000);
    } catch (err) { handleUpdateStatus("error", err instanceof Error ? err.message : "Upload failed"); setIsUploading(false); setUploadProgress(0); }
    if (e.target) e.target.value = "";
  };

  return (
    <>
      {showOverlay && <div className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-30 pointer-events-auto" />}
      <div className={`relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-amber-300/20 ${showOverlay ? "z-40" : ""}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#04231a] via-[#0a3d2b] to-[#062818]" />
        <div className="absolute -top-20 -right-12 w-40 h-40 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-8 w-32 h-32 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
        <div className="relative p-5">
          <AvatarSection pI={pI} avatarLoadError={avatarLoadError} setAvatarLoadError={setAvatarLoadError} isUploading={isUploading} uploadProgress={uploadProgress} onUpload={handleAvatarUpload} onTrigger={() => fileInputRef.current?.click()} fileInputRef={fileInputRef} ud={ud} session={session} />
          <Badges mN={mN} tN={tN} />
          <ProfileProgressBar pc={pc} />
          {alertState.show && <AlertBar alertState={alertState} onDismiss={dismissAlert} />}
          <ProfileFields ud={ud} onStatus={handleUpdateStatus} session={session} />
          <QuickLinks communityStats={communityStats} totalTaxes={totalTaxes} formatAmount={formatAmount} onShowCommunityStats={onShowCommunityStats} onShowTaxes={onShowTaxes} />
        </div>
      </div>
    </>
  );
}

function AvatarSection({ pI, avatarLoadError, setAvatarLoadError, isUploading, uploadProgress, onUpload, onTrigger, fileInputRef, ud, session }: any) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="relative h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center ring-2 ring-amber-300/30 shadow-md shrink-0">
        {pI && !avatarLoadError ? (
          <img src={pI} alt="" className="h-14 w-14 rounded-full object-cover" onError={() => setAvatarLoadError(true)} />
        ) : (
          <User className="w-6 h-6 text-white" />
        )}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" className="hidden" onChange={onUpload} disabled={isUploading} />
        <button onClick={onTrigger} disabled={isUploading} className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 hover:bg-amber-400 text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50">
          <Camera className="w-2.5 h-2.5" />
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white truncate">{ud?.firstname || ud?.lastname ? `${ud?.firstname ?? ""} ${ud?.lastname ?? ""}`.trim() : session?.user?.name || "Member"}</p>
        <p className="text-xs text-emerald-100/60 truncate">{session?.user?.email || ""}</p>
      </div>
      {isUploading && (
        <div className="w-20">
          <div className="text-[9px] text-emerald-100/70 mb-0.5">{uploadProgress}%</div>
          <div className="w-full bg-emerald-900/40 rounded-full h-1">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function Badges({ mN, tN }: { mN: string; tN: string }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 bg-emerald-500/15 text-emerald-200 ring-emerald-300/30"><Crown className="h-3 w-3" />{mN}</span>
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 bg-amber-500/15 text-amber-200 ring-amber-300/30"><Award className="h-3 w-3" />{tN}</span>
    </div>
  );
}

function ProfileProgressBar({ pc }: { pc: any }) {
  const pct = pc.completionPercentage;
  const done = pc.isComplete;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-[10px] mb-1">
        <span className="text-emerald-100/70 font-medium">Profile Status</span>
        <span className={`font-bold tabular-nums ${done ? "text-emerald-300" : pct >= 60 ? "text-amber-300" : "text-red-300"}`}>{pct}%</span>
      </div>
      <div className="w-full bg-emerald-900/40 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${done ? "bg-emerald-400" : "bg-gradient-to-r from-amber-400 to-emerald-400"}`} style={{ width: `${pct}%` }} />
      </div>
      {!done && pc.missingFields.length > 0 && (
        <p className="text-[9px] text-amber-200/60 mt-1">Missing: {pc.missingFields.join(", ")}</p>
      )}
      {done && <p className="text-[9px] text-emerald-300/70 mt-1">Profile complete</p>}
    </div>
  );
}

function AlertBar({ alertState, onDismiss }: { alertState: any; onDismiss: () => void }) {
  const cls = alertState.type === "success" ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-200" : alertState.type === "warning" ? "bg-amber-500/15 border-amber-400/30 text-amber-200" : "bg-red-500/15 border-red-400/30 text-red-200";
  return (
    <div className={`mb-3 p-2 rounded-lg border text-[10px] flex items-center justify-between ${cls}`}>
      <span>{alertState.message}</span>
      <button onClick={onDismiss} className="ml-1 p-0.5 hover:bg-white/10 rounded transition-colors"><X className="w-2.5 h-2.5" /></button>
    </div>
  );
}

function ProfileFields({ ud, onStatus, session }: { ud: any; onStatus: (s: "loading" | "success" | "error", m: string) => void; session: any }) {
  return (
    <div className="space-y-1 mb-4">
      <ProfileField label="First Name" value={ud?.firstname || ""} fieldKey="firstname" icon={User} onStatus={onStatus} />
      <ProfileField label="Last Name" value={ud?.lastname || ""} fieldKey="lastname" icon={User} onStatus={onStatus} />
      <ProfileField label="Email" value={ud?.email || ""} fieldKey="email" icon={Mail} editable={false} onStatus={onStatus} />
      <ProfileField label="Phone" value={ud?.mobile || ""} fieldKey="mobile" icon={Phone} onStatus={onStatus} />
      <ProfileField label="Address" value={ud?.address || ""} fieldKey="address" icon={MapPin} onStatus={onStatus} />
      <div className="rounded-lg bg-white/95 dark:bg-slate-900/90 p-2.5 mt-1">
        <LocationCascadeField countryValue={ud?.country || null} stateValue={ud?.state || null} cityValue={ud?.city || null} countryName={ud?.countryRelation?.name || null} stateName={ud?.stateRelation?.name || null} cityName={ud?.cityRelation?.name || null} onUpdateStatus={onStatus} />
      </div>
      <div className="rounded-lg bg-white/95 dark:bg-slate-900/90 p-2.5 mt-1">
        <BankDetailsField userId={session?.user?.id || ""} />
      </div>
      <ProfileField label="Gender" value={ud?.gender || ""} fieldKey="gender" icon={User} onStatus={onStatus} />
    </div>
  );
}

function ProfileField({ label, value, fieldKey, icon: Icon, editable = true, onStatus }: { label: string; value: string; fieldKey: string; icon?: any; editable?: boolean; onStatus?: (s: "loading" | "success" | "error", m: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const utils = api.useUtils();
  const updateProfile = api.user.updateDetails.useMutation({
    onMutate: () => onStatus?.("loading", `Updating ${label.toLowerCase()}...`),
    onSuccess: async () => { setIsEditing(false); onStatus?.("success", `${label} updated!`); await utils.user.getDetails.invalidate(); },
    onError: () => { setEditValue(value); setIsEditing(false); onStatus?.("error", `Failed to update ${label.toLowerCase()}.`); },
  });
  const save = () => updateProfile.mutate({ [fieldKey]: editValue } as any);
  const cancel = () => { setEditValue(value); setIsEditing(false); };
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-emerald-800/30 last:border-b-0">
      <div className="flex-1 min-w-0">
        <label className="text-[10px] font-medium text-emerald-100/60 flex items-center gap-1.5 mb-0.5">{Icon && <Icon className="w-3 h-3 text-emerald-400/70" />}{label}</label>
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }} autoFocus disabled={updateProfile.isPending} className="text-xs text-white bg-emerald-900/40 border border-emerald-400/30 rounded px-1.5 py-0.5 w-full focus:border-amber-400/50 focus:outline-none" />
            {updateProfile.isPending && <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
          </div>
        ) : <span className="text-xs text-white truncate block">{value || "Not set"}</span>}
      </div>
      {editable && <div className="flex items-center gap-0.5 ml-1 shrink-0">{isEditing ? (
        <>
          <button onClick={save} disabled={updateProfile.isPending} className="p-0.5 text-emerald-400 hover:bg-emerald-500/20 rounded disabled:opacity-50"><Check className="w-3 h-3" /></button>
          <button onClick={cancel} disabled={updateProfile.isPending} className="p-0.5 text-emerald-100/40 hover:bg-emerald-500/20 rounded disabled:opacity-50"><X className="w-3 h-3" /></button>
        </>
      ) : <button onClick={() => { setIsEditing(true); setEditValue(value); }} className="p-0.5 text-amber-300/60 hover:bg-amber-500/20 rounded"><Edit className="w-3 h-3" /></button>}</div>}
    </div>
  );
}

function QuickLinks({ communityStats, totalTaxes, formatAmount, onShowCommunityStats, onShowTaxes }: { communityStats: any; totalTaxes: number; formatAmount: (n: number) => string; onShowCommunityStats?: () => void; onShowTaxes?: () => void }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button onClick={onShowCommunityStats} className="rounded-lg border border-emerald-300/15 bg-white/5 backdrop-blur-sm p-2.5 hover:bg-white/10 transition-all text-left">
          <p className="text-[9px] uppercase tracking-wider font-semibold text-emerald-100/70">Community</p>
          <p className="text-xs font-bold text-white">{communityStats?.platform?.totalUsers ?? "—"}</p>
        </button>
        <button onClick={onShowTaxes} className="rounded-lg border border-emerald-300/15 bg-white/5 backdrop-blur-sm p-2.5 hover:bg-white/10 transition-all text-left">
          <p className="text-[9px] uppercase tracking-wider font-semibold text-emerald-100/70">Taxes Paid</p>
          <p className="text-xs font-bold text-white">{formatAmount(totalTaxes)}</p>
        </button>
      </div>
      <Link href="/settings" className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-300/25 bg-white/10 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-white/15 ring-1 ring-amber-300/15 transition-all"><Settings className="w-3.5 h-3.5" />Account Settings</Link>
    </>
  );
}
