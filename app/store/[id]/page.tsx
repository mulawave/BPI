import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/layout/DashboardShell";
import StoreDetailClient from "../../../components/store/StoreDetailClient";

const mapRewardConfig = (rc?: any) => {
  if (!rc) return [] as any[];
  return [
    {
      reward_id: rc.id,
      reward_type: rc.rewardType,
      reward_value: Number(rc.rewardValue ?? 0),
      reward_value_type: rc.rewardValueType,
      vesting_rule: rc.vestingRule,
      max_reward_cap: rc.maxRewardCap ? Number(rc.maxRewardCap) : null,
      utility_token_symbol: rc.utilityTokenSymbol,
      is_active: rc.isActive,
    },
  ];
};

const mapProduct = (dbProduct: any) => {
  return {
    product_id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    product_type: dbProduct.productType?.toLowerCase?.() ?? dbProduct.productType,
    base_price_fiat: Number(dbProduct.basePriceFiat ?? 0),
    accepted_tokens: dbProduct.acceptedTokens ?? [],
    token_payment_limits: (dbProduct.tokenPaymentLimits as Record<string, number>) ?? {},
    reward_config: mapRewardConfig(dbProduct.rewardConfig),
    inventory_type: dbProduct.inventoryType?.toLowerCase?.() ?? dbProduct.inventoryType,
    status: dbProduct.status?.toLowerCase?.() ?? dbProduct.status,
    hero_badge: dbProduct.heroBadge,
    images: dbProduct.images ?? [],
    featured: dbProduct.featured,
    pickup_center_id: dbProduct.pickupCenterId,
    reward_center_id: dbProduct.rewardCenterId,
    delivery_required: dbProduct.deliveryRequired,
    created_at: dbProduct.createdAt,
    updated_at: dbProduct.updatedAt,
  };
};

export const dynamic = "force-dynamic";

export default async function StoreDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const rawProduct = await prisma.product.findUnique({
    where: { id: params.id },
    include: { rewardConfig: true },
  });

  const product = rawProduct ? mapProduct(rawProduct) : null;

  if (!product) return notFound();

  return (
    <DashboardShell session={session}>
      <StoreDetailClient product={product} />
    </DashboardShell>
  );
}
