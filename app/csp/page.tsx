import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import CspDashboard from "@/components/csp/CspDashboard";
import CspAutoContributeSettings from "@/components/csp/CspAutoContributeSettings";
import CspShell from "@/components/csp/CspShell";

export const dynamic = "force-dynamic";

export default async function CspPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <CspShell session={session}>
      <CspDashboard userName={session?.user?.name ?? session?.user?.email} />
      <div className="mt-6">
        <CspAutoContributeSettings />
      </div>
    </CspShell>
  );
}
