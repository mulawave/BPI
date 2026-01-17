import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import UserSecuritySettingsPanel from "@/components/user/SecuritySettingsPanel";

export default async function UserSettingsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Account Settings
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your account security and preferences
          </p>
        </div>

        <UserSecuritySettingsPanel />
      </div>
    </div>
  );
}
