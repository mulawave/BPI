"use client";

import { useSession, signOut } from "next-auth/react";
import { MdWarning, MdExitToApp } from "react-icons/md";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function ImpersonationBanner() {
  const { data: session } = useSession();
  const isImpersonating = (session as any)?.user?.isImpersonation;
  const impersonatedBy = (session as any)?.user?.impersonatedByEmail;
  const targetUserEmail = session?.user?.email;
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";

  if (!isImpersonating) return null;

  const handleEndImpersonation = async () => {
    // Check if we can close the window (opened via window.open)
    if (window.opener && !window.opener.closed) {
      toast.success("Closing impersonation session...");
      window.close();
    } else {
      // Fallback: sign out and redirect to admin
      toast.success("Ending impersonation session...");
      await signOut({ callbackUrl: baseUrl ? `${baseUrl}/admin/users` : "/admin/users" });
    }
  };

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-2xl"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <MdWarning size={24} />
            </div>
            <div>
              <p className="font-bold text-lg">⚠️ Admin Impersonation Mode</p>
              <p className="text-sm text-white/90">
                You are logged in as <strong>{targetUserEmail}</strong> (Admin: {impersonatedBy})
              </p>
            </div>
          </div>
          <button
            onClick={handleEndImpersonation}
            className="flex items-center gap-2 px-6 py-2 bg-white text-red-600 hover:bg-gray-100 rounded-lg transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <MdExitToApp size={20} />
            <span>End Impersonation</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
