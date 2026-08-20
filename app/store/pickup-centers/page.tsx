import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import StoreShell from "@/components/store/StoreShell";
import { PickupCentersPublic } from "@/components/store/PickupCentersPublic";

export const dynamic = "force-dynamic";

export default async function PickupCentersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <StoreShell session={session}>
      <PickupCentersPublic />
    </StoreShell>
  );
}
