import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import HelpShell from "@/components/help/HelpShell";
import LearningCenter from "@/components/help/LearningCenter";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Learning Center | BPI",
  description: "Structured guides and tutorials to help you get the most out of BPI.",
};

export default async function LearningPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <HelpShell session={session}>
      <LearningCenter />
    </HelpShell>
  );
}
