import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import WalletAutoDebitSettings from "@/components/wallet/WalletAutoDebitSettings";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WalletSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <Link href="/dashboard" className="hover:text-gray-700 dark:hover:text-gray-200">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium">Wallet Settings</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Advanced Wallet Settings
        </h1>

        <WalletAutoDebitSettings />
      </div>
    </div>
  );
}
