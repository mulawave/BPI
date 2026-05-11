export function getSessionTokenName() {
  return process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}

export function getImpersonationRestoreTokenName() {
  return process.env.NODE_ENV === "production"
    ? "__Secure-bpi-admin-restore-token"
    : "bpi-admin-restore-token";
}

export function getSessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}