import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { StoreExperience } from "@/components/store/StoreExperience";
import DashboardShell from "@/components/layout/DashboardShell";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { resolvePickupAccess } from "@/server/services/pickup-access.service";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }
  const access = await resolvePickupAccess(prisma, session.user as any);

  return (
    <DashboardShell session={session}>
      <div className="flex flex-wrap items-center justify-end gap-3 px-4 md:px-10 lg:px-16">
        <Link href="/store/pickup-centers">
          <Button variant="outline" size="sm">View Pickup Centers</Button>
        </Link>
        {(access.isAdmin || access.isOperator) && (
          <Link href="/store/pickup-verify">
            <Button variant="outline" size="sm" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-200">
              Pickup Center Portal
            </Button>
          </Link>
        )}
      </div>
      <div className="md:px-10 lg:px-16">
        <StoreExperience />
      </div>
    </DashboardShell>
  );
}
