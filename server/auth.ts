import NextAuth, { type NextAuthOptions, type Session, type User } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export const authConfig: NextAuthOptions = {
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
          role: user.role ?? "user"
        };
      },
    }),
  ],
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // If signing in successfully, always redirect to dashboard
      if (url.includes("/api/auth/callback")) {
        return `${baseUrl}/dashboard`;
      }
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
    async jwt({ token, user }) {
      // If user object exists (first time login), add user info to token
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      // Pass user info from token to session
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    }
  }
};



import { getServerSession } from "next-auth";
export const auth = () => getServerSession(authConfig);

const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };
