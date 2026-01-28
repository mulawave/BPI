import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import { PickupCentersPublic } from "@/components/store/PickupCentersPublic";

export const dynamic = "force-dynamic";

export default async function PickupCentersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardShell session={session}>
      <div className="md:px-10 lg:px-16 space-y-6">
        <PickupCentersPublic />
      </div>
    </DashboardShell>
  );
}
