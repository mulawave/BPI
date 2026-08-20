import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { StoreExperience } from "@/components/store/StoreExperience";
import StoreShell from "@/components/store/StoreShell";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <StoreShell session={session}>
      <StoreExperience />
    </StoreShell>
  );
}
