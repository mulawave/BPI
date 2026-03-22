import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import CspDashboard from "@/components/csp/CspDashboard";
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
    </CspPageShell>
  );
}
