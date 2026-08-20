import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import HelpShell from "@/components/help/HelpShell";
import HelpTopicDetail from "@/components/help/HelpTopicDetail";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Help Topic | BPI",
  description: "Step-by-step help and FAQs for BPI features.",
};

export default async function HelpTopicPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = (session.user as any)?.role === "admin" || (session.user as any)?.role === "super_admin";

  return (
    <HelpShell session={session}>
      <HelpTopicDetail isAdmin={isAdmin} />
    </HelpShell>
  );
}
