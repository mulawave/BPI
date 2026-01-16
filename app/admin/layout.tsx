"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import { api } from "../../client/trpc";
import toast from "react-hot-toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // IMPORTANT: /admin/login lives under this layout, so we must NOT gate it.
  const isAdminAuthRoute = pathname === "/admin/login";
  
  // Check admin access
  const {
    data: adminAccess,
    isLoading,
    error: adminAccessError,
    refetch: refetchAdminAccess,
  } = api.adminAuth.checkAdminAccess.useQuery(
    undefined,
    {
      enabled: status === "authenticated" && !isAdminAuthRoute,
      retry: 1,
    }
  );

  // Redirect if not admin
  useEffect(() => {
    if (isAdminAuthRoute) return;
    if (status === "loading" || isLoading) return;

    if (status === "unauthenticated") {
      router.push("/admin/login");
      return;
    }

    if (adminAccess && !adminAccess.isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      router.push("/admin/login");
    }
  }, [status, adminAccess, isLoading, router]);

  // Get pending payments count
  const { data: dashboardStats } = api.admin.getDashboardStats.useQuery(
    undefined,
    {
      enabled: (adminAccess?.isAdmin || false) && !isAdminAuthRoute,
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  // Allow the login route to render without admin checks.
  if (isAdminAuthRoute) {
    return <>{children}</>;
  }

  // Show loading state (ONLY while loading)
  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-500 border-t-transparent mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">
            Verifying admin access...
          </p>
        </div>
      </div>
    );
  }

  // If unauthenticated, the redirect effect will run; show a deterministic state.
  if (status === "unauthenticated") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-500 border-t-transparent mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Redirecting to admin login...</p>
        </div>
      </div>
    );
  }

  // Surface tRPC errors instead of spinning forever.
  if (adminAccessError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin access check failed</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {adminAccessError.message || "Unable to verify admin access right now."}
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => refetchAdminAccess()}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/login")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
            >
              Go to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated but not admin, don't spin forever.
  if (adminAccess && !adminAccess.isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Access denied</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Your account does not have admin privileges.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin/login")}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Switch account
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/login")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
            >
              Go to admin login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated but adminAccess is still undefined (unexpected), show a recoverable state.
  if (!adminAccess) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin check pending</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Please retry verifying admin access.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => refetchAdminAccess()}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--muted))] via-[hsl(var(--background))] to-[hsl(var(--accent))] dark:from-[hsl(var(--background))] dark:via-[hsl(var(--card))] dark:to-[hsl(var(--background))]">
      <AdminSidebar pendingCount={dashboardStats?.pendingPayments || 0} />
      
      <div className="lg:pl-[280px]">
        <AdminHeader
          admin={{
            name: session?.user?.name,
            email: session?.user?.email,
            image: session?.user?.image,
          }}
        />
        
        <main className="p-6">
          <div className="mx-auto max-w-screen-2xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
