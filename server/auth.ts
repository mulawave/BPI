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
        
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        
        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;
        
        // Return user object with all needed fields for JWT
        return { 
          id: user.id, 
          email: user.email ?? undefined, 
          name: user.name ?? undefined,
          role: user.userType ?? "user"
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
      const DB_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
      const now = Date.now();
      const lastFetch = (token as any)._dbFetchedAt ?? 0;
      const needsRefresh = now - lastFetch > DB_CACHE_TTL_MS;

      if (token?.id && needsRefresh) {
        // Split into two queries: (1) base membership/role — must always succeed,
        // (2) empowerment include — may fail if schema migration not yet applied on production.
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              activeMembershipPackageId: true,
              membershipActivatedAt: true,
              membershipExpiresAt: true,
              userType: true,
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

          (token as any).hasActiveMembership = membershipAccess.membershipValid;
          (token as any).membershipExpiresAt = membershipAccess.effectiveMembershipExpiresAt?.toISOString() ?? null;
          (token as any).membershipDerivedFromActivation = membershipAccess.derivedFromActivation;
          token.role = dbUser?.userType ?? "user";
        } catch (e) {
          // Preserve existing values rather than forcing false
          if ((token as any).hasActiveMembership === undefined) {
            (token as any).hasActiveMembership = false;
          }
          if ((token as any).membershipExpiresAt === undefined) {
            (token as any).membershipExpiresAt = null;
          }
        }

        // Empowerment check — isolated so a schema mismatch on prod won't break login
        try {
          const empPkgs = await prisma.empowermentPackage.findMany({
            where: { beneficiaryId: token.id as string },
            select: { status: true },
          });
          (token as any).hasActiveEmpowerment = empPkgs.some(
            (p: any) => typeof p?.status === "string" && p.status.startsWith("Active")
          );
        } catch (e) {
          (token as any).hasActiveEmpowerment = false;
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
