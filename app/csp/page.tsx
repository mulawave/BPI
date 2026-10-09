import Link from "next/link";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import CspDashboard from "@/components/csp/CspDashboard";
import CspAutoContributeSettings from "@/components/csp/CspAutoContributeSettings";
import CspShell from "@/components/csp/CspShell";

export const dynamic = "force-dynamic";

export default async function CspPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <CspShell session={session}>
      <div className="flex justify-end mb-2">
        <Link href="/csp/how-it-works" className="text-xs text-gray-500 dark:text-gray-400 underline hover:text-gray-700 dark:hover:text-gray-200">
          How CSP works
        </Link>
      </div>
      <CspDashboard userName={session?.user?.name ?? session?.user?.email} />
      <div className="mt-6">
        <CspAutoContributeSettings />
      </div>
    </CspShell>
  );
}
