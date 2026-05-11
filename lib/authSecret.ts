export function resolveAuthSecret(): string | null {
  return process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? null;
}

export function requireAuthSecret(): string {
  const secret = resolveAuthSecret();

  if (!secret) {
    throw new Error("Missing auth secret. Set NEXTAUTH_SECRET or AUTH_SECRET.");
  }

  return secret;
}