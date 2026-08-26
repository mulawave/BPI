import NextAuth, { type NextAuthOptions, type Session, type User } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { resolveAppBaseUrl } from "@/lib/appUrl";
import { resolveAuthSecret } from "@/lib/authSecret";
import { evaluateMembershipAccess } from "@/lib/membershipAccess";

const AUTH_USER_LOOKUP_TTL_MS = 60_000;
const AUTH_DB_CACHE_TTL_MS = 5 * 60 * 1000;

const authUserLookupCache = new Map<string, { value: any; expiresAt: number }>();
const authUserLookupInFlight = new Map<string, Promise<any>>();

const authEnrichmentCache = new Map<
  string,
  {
    value: {
      role: string;
      hasActiveMembership: boolean;
      membershipExpiresAt: string | null;
      membershipDerivedFromActivation: boolean;
      hasActiveEmpowerment: boolean;
    };
    expiresAt: number;
  }
>();
const authEnrichmentInFlight = new Map<string, Promise<any>>();

function isFresh(expiresAt: number) {
  return expiresAt > Date.now();
}

async function getCachedAuthUserByEmail(email: string) {
  const key = email.trim().toLowerCase();
  const cached = authUserLookupCache.get(key);
  if (cached && isFresh(cached.expiresAt)) {
    return cached.value;
  }

  const inFlight = authUserLookupInFlight.get(key);
  if (inFlight) {
    return inFlight;
  }

  const request = prisma.user
    .findUnique({ where: { email: key } })
    .then((user) => {
      authUserLookupCache.set(key, {
        value: user,
        expiresAt: Date.now() + AUTH_USER_LOOKUP_TTL_MS,
      });
      return user;
    })
    .finally(() => {
      authUserLookupInFlight.delete(key);
    });

  authUserLookupInFlight.set(key, request);
  return request;
}

async function getCachedAuthEnrichment(userId: string) {
  const cached = authEnrichmentCache.get(userId);
  if (cached && isFresh(cached.expiresAt)) {
    return cached.value;
  }

  const inFlight = authEnrichmentInFlight.get(userId);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        activeMembershipPackageId: true,
        membershipActivatedAt: true,
        membershipExpiresAt: true,
        userType: true,
        role: true,
      },
    });

    const membershipPackage = dbUser?.activeMembershipPackageId
      ? await prisma.membershipPackage.findUnique({
          where: { id: dbUser.activeMembershipPackageId },
          select: { renewalCycle: true },
        })
      : null;

    const membershipAccess = evaluateMembershipAccess({
      activeMembershipPackageId: dbUser?.activeMembershipPackageId,
      membershipActivatedAt: dbUser?.membershipActivatedAt,
      membershipExpiresAt: dbUser?.membershipExpiresAt,
      renewalCycleDays: membershipPackage?.renewalCycle,
    });

    let hasActiveEmpowerment = false;
    try {
      const empPkgs = await prisma.empowermentPackage.findMany({
        where: { beneficiaryId: userId },
        select: { status: true },
      });
      hasActiveEmpowerment = empPkgs.some(
        (p: any) => typeof p?.status === "string" && p.status.startsWith("Active")
      );
    } catch {
      hasActiveEmpowerment = false;
    }

    const value = {
      role: dbUser?.role || dbUser?.userType || "user",
      hasActiveMembership: membershipAccess.membershipValid,
      membershipExpiresAt: membershipAccess.effectiveMembershipExpiresAt?.toISOString() ?? null,
      membershipDerivedFromActivation: membershipAccess.derivedFromActivation,
      hasActiveEmpowerment,
    };

    // Backfill: if role field is still default "user" but userType indicates admin/super_admin,
    // sync the role field to prevent legacy admin lockout.
    if (dbUser && dbUser.role === "user" && (dbUser.userType === "admin" || dbUser.userType === "super_admin")) {
      prisma.user.update({
        where: { id: userId },
        data: { role: dbUser.userType },
      }).catch(() => {});
    }

    authEnrichmentCache.set(userId, {
      value,
      expiresAt: Date.now() + AUTH_DB_CACHE_TTL_MS,
    });

    return value;
  })().finally(() => {
    authEnrichmentInFlight.delete(userId);
  });

  authEnrichmentInFlight.set(userId, request);
  return request;
}

export const authConfig: NextAuthOptions = {
  secret: resolveAuthSecret() ?? undefined,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // Changed from "database" to "jwt" for better compatibility
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = creds?.email as string | undefined;
        const password = creds?.password as string | undefined;
        if (!email || !password) return null;
        
        const user = await getCachedAuthUserByEmail(email);
        if (!user || !user.passwordHash) return null;
        
        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;
        
        // Return user object with all needed fields for JWT
        return { 
          id: user.id, 
          email: user.email ?? undefined, 
          name: user.name ?? undefined,
          role: user.role || user.userType || "user"
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/logout"
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      const resolved = await resolveAppBaseUrl();
      const appUrl = resolved?.replace(/\/$/, "");
      const normalizedBaseUrl = appUrl && appUrl !== baseUrl ? appUrl : baseUrl;

      // If signing in successfully, always redirect to dashboard
      if (url.includes("/api/auth/callback")) {
        return `${normalizedBaseUrl}/dashboard`;
      }
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${normalizedBaseUrl}${url}`;
      // Allows callback URLs on the same origin
      try {
        const target = new URL(url);
        if (target.origin === baseUrl || (appUrl && target.origin === appUrl)) return url;
      } catch (e) {
        // ignore
      }
      return `${normalizedBaseUrl}/dashboard`;
    },
    async jwt({ token, user }) {
      // If user object exists (first time login), add user info to token
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? "user";
        (token as any).isImpersonation = (user as any).isImpersonation ?? (token as any).isImpersonation ?? false;
        (token as any).impersonatedBy = (user as any).impersonatedBy ?? (token as any).impersonatedBy ?? null;
        (token as any).impersonatedByEmail = (user as any).impersonatedByEmail ?? (token as any).impersonatedByEmail ?? null;
        (token as any).impersonationSessionId = (user as any).impersonationSessionId ?? (token as any).impersonationSessionId ?? null;
        // Force DB fetch on first login
        (token as any)._dbFetchedAt = 0;
      }

      // Enrich token with membership flags (Edge-safe gating via middleware)
      // Use a 5-minute TTL to avoid DB queries on every single request.
      const now = Date.now();
      const lastFetch = (token as any)._dbFetchedAt ?? 0;
      const needsRefresh = now - lastFetch > AUTH_DB_CACHE_TTL_MS;

      if (token?.id && needsRefresh) {
        try {
          const enrichment = await getCachedAuthEnrichment(token.id as string);
          (token as any).hasActiveMembership = enrichment.hasActiveMembership;
          (token as any).membershipExpiresAt = enrichment.membershipExpiresAt;
          (token as any).membershipDerivedFromActivation = enrichment.membershipDerivedFromActivation;
          (token as any).hasActiveEmpowerment = enrichment.hasActiveEmpowerment;
          token.role = enrichment.role;
        } catch (e) {
          // Preserve existing values rather than forcing false
          if ((token as any).hasActiveMembership === undefined) {
            (token as any).hasActiveMembership = false;
          }
          if ((token as any).membershipExpiresAt === undefined) {
            (token as any).membershipExpiresAt = null;
          }
          if ((token as any).hasActiveEmpowerment === undefined) {
            (token as any).hasActiveEmpowerment = false;
          }
        }

        (token as any)._dbFetchedAt = now;
      }

      if ((token as any).isImpersonation) {
        (token as any).isImpersonation = true;
        (token as any).impersonatedBy = (token as any).impersonatedBy ?? null;
        (token as any).impersonatedByEmail = (token as any).impersonatedByEmail ?? null;
        (token as any).impersonationSessionId = (token as any).impersonationSessionId ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      // Pass user info and membership flags from token to session
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).hasActiveMembership = (token as any).hasActiveMembership ?? false;
        (session.user as any).membershipExpiresAt = (token as any).membershipExpiresAt ?? null;
        (session.user as any).membershipDerivedFromActivation = (token as any).membershipDerivedFromActivation ?? false;
        (session.user as any).hasActiveEmpowerment = (token as any).hasActiveEmpowerment ?? false;
        (session.user as any).isImpersonation = (token as any).isImpersonation ?? false;
        (session.user as any).impersonatedBy = (token as any).impersonatedBy ?? null;
        (session.user as any).impersonatedByEmail = (token as any).impersonatedByEmail ?? null;
        (session.user as any).impersonationSessionId = (token as any).impersonationSessionId ?? null;
      }
      return session;
    }
  }
};



import { getServerSession } from "next-auth";
export const auth = () => getServerSession(authConfig);

const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };
