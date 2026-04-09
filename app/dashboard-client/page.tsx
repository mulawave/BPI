"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DashboardContent from "@/components/DashboardContent";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  console.log("🏠 Client Dashboard session check:", { session, status, hasUser: !!session?.user });
  
  useEffect(() => {
    if (status === "loading") return; // Still loading
    
    if (!session?.user) {
      console.log("❌ Client Dashboard: No session/user, redirecting to login");
      router.push("/login");
      return;
    }
    
    console.log("✅ Client Dashboard: Session found for user:", session.user.email);
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e9f5ee] via-[#f7fbe9] to-[#f5f5f5] dark:from-[#0a1f16] dark:via-[#0d2b1f] dark:to-bpi-dark-card flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600 dark:border-emerald-800 dark:border-t-emerald-400" />
          <p className="text-lg font-semibold text-[#0d3b29] dark:text-emerald-200/80">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e9f5ee] via-[#f7fbe9] to-[#f5f5f5] dark:from-[#0a1f16] dark:via-[#0d2b1f] dark:to-bpi-dark-card flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600 dark:border-emerald-800 dark:border-t-emerald-400" />
          <p className="text-lg font-semibold text-[#0d3b29] dark:text-emerald-200/80">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return <DashboardContent session={session} />;
}