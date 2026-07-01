import type { PrismaClient } from "@prisma/client";

export type PickupAccess = {
  isAdmin: boolean;
  isOperator: boolean;
  centerIds: string[] | null;
  centers: { id: string; name: string }[];
};

type PickupAccessUser = {
  email?: string | null;
  role?: string | null;
};

export async function resolvePickupAccess(prisma: Pick<PrismaClient, "pickupCenter">, user: PickupAccessUser): Promise<PickupAccess> {
  const role = String(user.role ?? "").toLowerCase();
  const isAdmin = role === "admin" || role === "super_admin";
  if (isAdmin) {
    return { isAdmin: true, isOperator: true, centerIds: null, centers: [] };
  }

  const email = user.email?.trim();
  if (!email) {
    return { isAdmin: false, isOperator: false, centerIds: [], centers: [] };
  }

  const centers = await prisma.pickupCenter.findMany({
    where: {
      isActive: true,
      contactEmail: { equals: email, mode: "insensitive" },
    },
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    isAdmin: false,
    isOperator: centers.length > 0,
    centerIds: centers.map((center) => center.id),
    centers,
  };
}

export function canActOnCenter(access: PickupAccess, pickupCenterId: string | null | undefined) {
  if (access.isAdmin) return true;
  if (!pickupCenterId) return false;
  return access.centerIds?.includes(pickupCenterId) ?? false;
}
