import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import CspDashboard from "@/components/csp/CspDashboard";
import CspAutoContributeSettings from "@/components/csp/CspAutoContributeSettings";
import DashboardShell from "@/components/layout/DashboardShell";

export const dynamic = "force-dynamic";

export default async function CspPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardShell session={session}>
      <div className="w-full">
        <CspDashboard userName={session?.user?.name ?? session?.user?.email} />
        <div className="max-w-3xl mx-auto mt-10">
          <CspAutoContributeSettings />
        </div>
      </div>
    </DashboardShell>
  );
}
