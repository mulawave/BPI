import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import CBTPortalContent from "@/components/techquiz/CBTPortalContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TechQuiz CBT Portal | BPI",
};

export default async function TechQuizCBTPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <DashboardShell session={session}>
      <CBTPortalContent />
    </DashboardShell>
  );
}
