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
      <div className="min-h-screen bg-gradient-to-br from-[#e9f5ee] via-[#f7fbe9] to-[#f5f5f5] flex items-center justify-center">
        <div className="text-2xl font-semibold text-[#0d3b29]">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e9f5ee] via-[#f7fbe9] to-[#f5f5f5] flex items-center justify-center">
        <div className="text-2xl font-semibold text-red-600">Redirecting to login...</div>
      </div>
    );
  }

  return <DashboardContent session={session} />;
}