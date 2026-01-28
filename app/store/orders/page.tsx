import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import { StoreOrdersClient } from "@/components/store/StoreOrdersClient";

export const dynamic = "force-dynamic";

export default async function StoreOrdersPage({ searchParams }: { searchParams: { orderId?: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <DashboardShell session={session}>
      <div className="px-4 md:px-10 lg:px-16 py-6">
        <StoreOrdersClient focusOrderId={searchParams.orderId} />
      </div>
    </DashboardShell>
  );
}
