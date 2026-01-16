import { prisma } from "./prisma";

/**
 * Get location names for a user
 * @param userId - User ID
 * @returns Object with country, state, and city names
 */
export async function getUserLocationNames(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      countryRelation: {
        select: { name: true },
      },
      stateRelation: {
        select: { name: true },
      },
      cityRelation: {
        select: { name: true },
      },
    },
  });

  return {
    country: user?.countryRelation?.name || null,
    state: user?.stateRelation?.name || null,
    city: user?.cityRelation?.name || null,
  };
}

/**
 * Get full location string for a user (e.g., "Lagos, Lagos, Nigeria")
 * @param userId - User ID  
 * @returns Formatted location string
 */
export async function getUserLocationString(userId: string): Promise<string> {
  const location = await getUserLocationNames(userId);
  
  const parts = [
    location.city,
    location.state,
    location.country,
  ].filter(Boolean);
  
  return parts.length > 0 ? parts.join(", ") : "Location not set";
}

/**
 * Get all countries for dropdown
 */
export async function getAllCountries() {
  return await prisma.country.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      dialCode: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

/**
 * Get states for a specific country
 * @param countryId - Country ID
 */
export async function getStatesByCountry(countryId: number) {
  return await prisma.state.findMany({
    where: {
      countryId: countryId,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

/**
 * Get cities for a specific state
 * @param stateId - State ID
 */
export async function getCitiesByState(stateId: number) {
  return await prisma.city.findMany({
    where: {
      stateId: stateId,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}
