import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import ExternalTokenCheckoutClient from "@/components/store/ExternalTokenCheckoutClient";

export const dynamic = "force-dynamic";

export default async function ExternalTokenCheckoutPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orderId = String(searchParams.orderId ?? "");
  if (!orderId) redirect("/store");

  return <ExternalTokenCheckoutClient orderId={orderId} />;
}
