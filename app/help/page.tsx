import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import HelpShell from "@/components/help/HelpShell";
import HelpCenter from "@/components/help/HelpCenter";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Help Center | BPI",
  description: "Get help, browse guides, and ask RAVEN.",
};

export default async function HelpPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = (session.user as any)?.role === "admin" || (session.user as any)?.role === "super_admin";

  return (
    <HelpShell session={session}>
      <HelpCenter isAdmin={isAdmin} />
    </HelpShell>
  );
}
