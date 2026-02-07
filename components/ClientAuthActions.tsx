"use client";
import { signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function ClientAuthActions({ session }: { session: any }) {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";

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