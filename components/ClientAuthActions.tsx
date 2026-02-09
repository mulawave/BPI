"use client";
import { signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { resolveClientBaseUrl } from "@/lib/clientAppUrl";

export default function ClientAuthActions({ session }: { session: any }) {
  const baseUrl = resolveClientBaseUrl();

  if (session?.user) {
    return (
      <>
        <span>Signed in as <b>{session.user.email}</b></span>
        <Button
          variant="secondary"
          type="button"
          onClick={() => signOut({ callbackUrl: baseUrl ? `${baseUrl}/login` : "/login" })}
        >
          Sign out
        </Button>
      </>
    );
  }
  return (
    <Button type="button" onClick={() => signIn("github")}>Sign in with GitHub</Button>
  );
}