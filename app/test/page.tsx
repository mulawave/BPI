"use client";
import { api } from "@/client/trpc";

export default function TestPage() {
  const healthQuery = api.health.check.useQuery();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">BPI System Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. tRPC Connection Test</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> {healthQuery.isLoading ? "Loading..." : healthQuery.data ? "✅ Connected" : "❌ Failed"}</p>
            {healthQuery.error && (
              <p className="text-red-600"><strong>Error:</strong> {healthQuery.error.message}</p>
            )}
            {healthQuery.data && (
              <p className="text-green-600"><strong>Response:</strong> {JSON.stringify(healthQuery.data)}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">2. Flow Test Links</h2>
          <div className="space-y-3">
            <div>
              <a href="/register" className="text-blue-600 hover:underline font-medium">
                → Test User Registration
              </a>
              <p className="text-sm text-gray-600">Test the complete registration flow with referral tracking</p>
            </div>
            <div>
              <a href="/login" className="text-blue-600 hover:underline font-medium">
                → Test User Login
              </a>
              <p className="text-sm text-gray-600">Test login with credentials</p>
            </div>
            <div>
              <a href="/forgot-password" className="text-blue-600 hover:underline font-medium">
                → Test Password Reset
              </a>
              <p className="text-sm text-gray-600">Test forgot password flow</p>
            </div>
            <div>
              <a href="/dashboard" className="text-blue-600 hover:underline font-medium">
                → Test Dashboard (requires login)
              </a>
              <p className="text-sm text-gray-600">Test member dashboard with referral stats</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">3. Expected Test Flow</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Register a new user (with optional referral code in URL: ?ref=someId)</li>
            <li>Check that registration redirects to login page</li>
            <li>Login with the newly created credentials</li>
            <li>Verify dashboard loads with user information</li>
            <li>Check referral stats on dashboard</li>
            <li>Test logout functionality</li>
            <li>Test forgot password flow</li>
          </ol>
        </div>
      </div>
    </div>
  );
}