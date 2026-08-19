import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PremiumDashboard from "@/components/dashboard/PremiumDashboard";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  try {
    const session = await auth();
    if (!session?.user) redirect("/login");
    return (
      <DashboardShell session={session}>
        <PremiumDashboard session={session} />
      </DashboardShell>
    );
  } catch (error) {
    console.error("❌ Dashboard error:", error);
    redirect("/login");
  }
}