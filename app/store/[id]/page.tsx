import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/server/auth";
import { mockProducts } from "@/data/store/mockProducts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Gift, Coins } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import StoreDetailClient from "../../../components/store/StoreDetailClient";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

export const dynamic = "force-dynamic";

export default async function StoreDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const product = mockProducts.find((p) => p.product_id === params.id);
  if (!product) return notFound();

  return (
    <DashboardShell session={session}>
      <StoreDetailClient product={product} />
    </DashboardShell>
  );
}
