import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import HelpTopicDetail from "@/components/help/HelpTopicDetail";

export const dynamic = "force-dynamic";

export default async function HelpTopicPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = (session.user as any)?.role === "admin" || (session.user as any)?.role === "super_admin";

  return (
    <DashboardShell session={session}>
      <HelpTopicDetail isAdmin={isAdmin} />
    </DashboardShell>
  );
}
