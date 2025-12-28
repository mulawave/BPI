"use client";
import { signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function ClientAuthActions({ session }: { session: any }) {
  if (session?.user) {
    return (
      <>
        <span>Signed in as <b>{session.user.email}</b></span>
        <Button variant="secondary" type="button" onClick={() => signOut()}>Sign out</Button>
      </>
    );
  }
  return (
    <Button type="button" onClick={() => signIn("github")}>Sign in with GitHub</Button>
  );
}