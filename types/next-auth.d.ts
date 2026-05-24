import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      hasActiveMembership?: boolean;
      membershipExpiresAt?: string | null;
      membershipDerivedFromActivation?: boolean;
      isImpersonation?: boolean;
      impersonatedBy?: string | null;
      impersonatedByEmail?: string | null;
      impersonationSessionId?: string | null;
    };
  }

  interface User {
    id: string;
    role?: string;
    isImpersonation?: boolean;
    impersonatedBy?: string | null;
    impersonatedByEmail?: string | null;
    impersonationSessionId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    hasActiveMembership?: boolean;
    membershipExpiresAt?: string | null;
    membershipDerivedFromActivation?: boolean;
    isImpersonation?: boolean;
    impersonatedBy?: string | null;
    impersonatedByEmail?: string | null;
    impersonationSessionId?: string | null;
  }
}
