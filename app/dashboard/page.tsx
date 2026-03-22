import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import DashboardContent from "@/components/DashboardContent";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  console.log("🏠 Dashboard page loading...");
  
  try {
    const session = await auth();
    console.log("🏠 Dashboard session check:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user ? (session.user as any).id : null
    });
    
    if (!session?.user) {
      console.log("❌ Dashboard: No session/user, redirecting to login");
      redirect("/login");
    }

    console.log("✅ Dashboard: Rendering content for user:", session.user.email);
    return <DashboardContent session={session} />;
  } catch (error) {
    console.error("❌ Dashboard error:", error);
    redirect("/login");
  }
}