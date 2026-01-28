import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { StoreExperience } from "@/components/store/StoreExperience";
import DashboardShell from "@/components/layout/DashboardShell";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardShell session={session}>
      <div className="flex justify-end px-4 md:px-10 lg:px-16">
        <Link href="/store/pickup-centers">
          <Button variant="outline" size="sm">View Pickup Centers</Button>
        </Link>
      </div>
      <div className="md:px-10 lg:px-16">
        <StoreExperience />
      </div>
    </DashboardShell>
  );
}
