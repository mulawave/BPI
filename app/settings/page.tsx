import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import AccountShell from "@/components/account/AccountShell";
import SettingsLayout from "@/components/settings/SettingsLayout";

export default async function UserSettingsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AccountShell session={session}>
      <SettingsLayout session={session} />
    </AccountShell>
  );
}
