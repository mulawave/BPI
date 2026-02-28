import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import TechQuizContent from "@/components/techquiz/TechQuizContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TechQuiz Competition | BPI",
  description: "STEM Competition for secondary school students — BPI TechQuiz",
};

export default async function TechQuizPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <DashboardShell session={session}>
      <TechQuizContent />
    </DashboardShell>
  );
}
