import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import SchoolAdminDashboard from "@/components/techquiz/SchoolAdminDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "School Admin — TechQuiz | BPI",
};

export default async function TechQuizSchoolAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <DashboardShell session={session}>
      <SchoolAdminDashboard />
    </DashboardShell>
  );
}
