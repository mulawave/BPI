import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import TechQuizShell from "@/components/techquiz/TechQuizShell";
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
    <TechQuizShell session={session}>
      <TechQuizContent />
    </TechQuizShell>
  );
}
