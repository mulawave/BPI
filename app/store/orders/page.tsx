import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import StoreShell from "@/components/store/StoreShell";
import { StoreOrdersClient } from "@/components/store/StoreOrdersClient";

export const dynamic = "force-dynamic";

export default async function StoreOrdersPage({ searchParams }: { searchParams: { orderId?: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <StoreShell session={session}>
      <StoreOrdersClient focusOrderId={searchParams.orderId} />
    </StoreShell>
  );
}
