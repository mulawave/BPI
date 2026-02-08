import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import EmpowermentContent from "@/components/empowerment/EmpowermentContent";

export const dynamic = "force-dynamic";

export default async function EmpowermentPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardShell session={session}>
      <EmpowermentContent />
    </DashboardShell>
  );
}
