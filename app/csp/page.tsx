import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import CspDashboard from "@/components/csp/CspDashboard";

export const dynamic = "force-dynamic";

export default async function CspPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardShell session={session}>
      <CspDashboard userName={session?.user?.name ?? session?.user?.email} />
    </DashboardShell>
  );
}
