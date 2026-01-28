import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import HelpCenter from "@/components/help/HelpCenter";

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = (session.user as any)?.role === "admin" || (session.user as any)?.role === "super_admin";

  return (
    <DashboardShell session={session}>
      <HelpCenter isAdmin={isAdmin} />
    </DashboardShell>
  );
}
