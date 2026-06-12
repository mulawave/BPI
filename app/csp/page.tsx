import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import CspDashboard from "@/components/csp/CspDashboard";
import CspAutoContributeSettings from "@/components/csp/CspAutoContributeSettings";
import CspPageShell from "@/components/csp/CspPageShell";

export const dynamic = "force-dynamic";

export default async function CspPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <CspPageShell>
      <CspDashboard userName={session?.user?.name ?? session?.user?.email} />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <CspAutoContributeSettings />
      </div>
    </CspPageShell>
  );
}
