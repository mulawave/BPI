"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { MdWarning, MdExitToApp } from "react-icons/md";
import toast from "react-hot-toast";
import { resolveClientBaseUrl } from "@/lib/clientAppUrl";

export default function ImpersonationBanner() {
  const { data: session } = useSession();
  const [ending, setEnding] = useState(false);
  const isImpersonating = (session as any)?.user?.isImpersonation;
  const impersonatedBy = (session as any)?.user?.impersonatedByEmail;
  const targetUserEmail = session?.user?.email;
  const baseUrl = resolveClientBaseUrl();

  if (!isImpersonating) return null;

  const handleEndImpersonation = async () => {
    setEnding(true);
    try {
      const response = await fetch("/api/auth/impersonate/end", {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string; redirectUrl?: string }
        | null;

      if (!response.ok || !payload?.success) {
        toast.error(payload?.error || "Failed to restore admin session");
        return;
      }

      toast.success("Returning to your admin session...");
      const redirectUrl = payload.redirectUrl || "/admin/users";
      window.location.assign(baseUrl ? `${baseUrl}${redirectUrl}` : redirectUrl);
    } catch {
      toast.error("Failed to restore admin session");
    } finally {
      setEnding(false);
    }
  };

  return (
    <div className="relative z-[60] bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 animate-pulse">
              <MdWarning size={24} />
            </div>
            <div>
              <p className="text-lg font-bold">Admin Impersonation Mode</p>
              <p className="text-sm text-white/90">
                You are operating as <strong>{targetUserEmail}</strong>. Ending this session returns you to {impersonatedBy}.
              </p>
            </div>
          </div>
          <button
            onClick={handleEndImpersonation}
            disabled={ending}
            className="flex items-center gap-2 rounded-lg bg-white px-6 py-2 font-bold text-red-600 shadow-lg transition-all hover:scale-105 hover:bg-gray-100 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MdExitToApp size={20} />
            <span>{ending ? "Restoring Admin..." : "End Impersonation"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
