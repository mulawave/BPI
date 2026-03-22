"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resolveClientBaseUrl } from "@/lib/clientAppUrl";
import { FiLogOut, FiArrowLeft, FiShield } from "react-icons/fi";

export default function LogoutPage() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const didSignOut = useRef(false);
  const baseUrl = useMemo(() => resolveClientBaseUrl().replace(/\/$/, ""), []);

  // Auto-signs out when this page mounts. This handles every path to /logout:
  // - Mobile nav button fallback href
  // - NextAuth pages.signOut redirect
  // - Direct navigation from any part of the app
  // Using a ref guard so React StrictMode double-invoke doesn't call signOut twice.
  useEffect(() => {
    if (didSignOut.current) return;
    didSignOut.current = true;
    setIsSigningOut(true);
    toast.loading("Signing you out...");
    signOut({ callbackUrl: `${baseUrl}/login` });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    toast.loading("Signing you out...");
    await signOut({ callbackUrl: `${baseUrl}/login` });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_800px_at_20%_10%,#2a6b47_0%,#0f3a29_35%,#0b2b1f_70%)] flex items-center justify-center p-4 md:p-10">
      <div className="fixed top-6 left-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg bg-[#0d3b29]/70 hover:bg-[#0d3b29]/90 transition-colors border border-[#fff3] backdrop-blur-md" style={{ minWidth: "220px", maxWidth: "340px" }}>
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/20 group-hover:bg-white/20 transition">
            <FiArrowLeft size={22} className="text-white" />
          </span>
          <span className="flex flex-col ml-2">
            <span className="text-white font-bold text-base leading-tight tracking-wide">Return to Dashboard</span>
            <span className="text-white/80 text-xs font-medium leading-tight">Cancel sign out</span>
          </span>
        </Link>
      </div>

      <div className="w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden backdrop-blur relative">
        <div className="grid md:grid-cols-[1.15fr_1fr]">
          <div className="relative bg-gradient-to-br from-[#2a6b47] via-[#0f3a29] to-[#0b2b1f] p-10 md:p-12">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_60%)]" />
            <div className="relative z-10 flex flex-col gap-8">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-12 h-12 rounded-full border border-white/25 bg-white/10">
                  <FiShield size={22} className="text-white" />
                </span>
                <div>
                  <p className="text-white/80 text-sm">Secure Session</p>
                  <h1 className="text-white text-2xl font-bold">Confirm Sign Out</h1>
                </div>
              </div>
              <p className="text-white/80 leading-relaxed">
                You are about to end your session. If you are on a shared device, sign out to keep your account secure.
              </p>
              <div className="grid gap-4">
                {[
                  { title: "Account Security", text: "Signing out clears your session and protects your data." },
                  { title: "Quick Return", text: "You can log back in anytime with your credentials." },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                    <p className="text-white font-semibold text-sm">{item.title}</p>
                    <p className="text-white/70 text-xs mt-1">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-bpi-dark-card p-8 md:p-10">
            <Card className="p-6 md:p-8 border border-[#e7e7e7] dark:border-bpi-border bg-white dark:bg-bpi-dark-card">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-12 h-12 rounded-full border border-[#d7e4dc] bg-[#f4fbf7] dark:border-bpi-border dark:bg-bpi-dark-accent">
                  <FiLogOut size={22} className="text-[#0d3b29] dark:text-white" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Session</p>
                  <h2 className="text-lg font-semibold text-foreground">Ready to leave?</h2>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Choose an action below. You can always come back to continue your membership journey.
              </p>
              <div className="grid gap-3">
                <Button
                  onClick={handleSignOut}
                  className="w-full bg-[#0d3b29] hover:bg-[#0b2f22] text-white"
                  disabled={isSigningOut}
                >
                  {isSigningOut ? "Signing out..." : "Sign out securely"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-[#0d3b29]/30 text-[#0d3b29] hover:bg-[#0d3b29]/10"
                  onClick={() => router.push("/dashboard")}
                  disabled={isSigningOut}
                >
                  Stay signed in
                </Button>
              </div>
            </Card>
            <p className="mt-6 text-xs text-muted-foreground">
              Need help? Visit the help center or contact support for assistance with your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
