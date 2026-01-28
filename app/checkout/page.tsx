import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import CheckoutClient from "@/components/store/CheckoutClient";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: { intent?: string; productId?: string; quantity?: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <CheckoutClient
      intentId={searchParams.intent || ""}
      productId={searchParams.productId || ""}
      quantity={Number(searchParams.quantity || "1")}
    />
  );
}
