import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import SettingsLayout from "@/components/settings/SettingsLayout";

export default async function UserSettingsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  return <SettingsLayout session={session} />;
}
