import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import PublicResultsContent from "@/components/techquiz/PublicResultsContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TechQuiz Results | BPI",
};

export default async function TechQuizResultsPage({
  params,
}: {
  params: { eventId: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <DashboardShell session={session}>
      <PublicResultsContent eventId={params.eventId} />
    </DashboardShell>
  );
}
