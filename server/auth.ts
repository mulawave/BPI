import NextAuth, { type NextAuthOptions, type Session, type User } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { resolveAppBaseUrl } from "@/lib/appUrl";
import { resolveAuthSecret } from "@/lib/authSecret";

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
            select: { activeMembershipPackageId: true, userType: true },
          });
          (token as any).hasActiveMembership = !!dbUser?.activeMembershipPackageId;
          token.role = dbUser?.userType ?? "user";
        } catch (e) {
          // Preserve existing values rather than forcing false
          if ((token as any).hasActiveMembership === undefined) {
            (token as any).hasActiveMembership = false;
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

      return token;
    },
    async session({ session, token }) {
      // Pass user info and membership flags from token to session
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).hasActiveMembership = (token as any).hasActiveMembership ?? false;
        (session.user as any).hasActiveEmpowerment = (token as any).hasActiveEmpowerment ?? false;
      }
      return session;
    }
  }
};



import { getServerSession } from "next-auth";
export const auth = () => getServerSession(authConfig);

const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };
