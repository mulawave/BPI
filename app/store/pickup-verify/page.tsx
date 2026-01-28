import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import { PickupVerifyClient } from "@/components/store/PickupVerifyClient";

export const dynamic = "force-dynamic";

export default async function PickupVerifyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <DashboardShell session={session}>
      <div className="px-4 md:px-10 lg:px-16 py-6">
        <PickupVerifyClient />
      </div>
    </DashboardShell>
  );
}
