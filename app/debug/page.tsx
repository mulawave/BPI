"use client";
import { useSession } from "next-auth/react";

export default function DebugPage() {
  const { data: session, status } = useSession();
  
  console.log("🔍 Client session data:", { session, status });
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">🔍 Client-Side Debug Information</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold">Session Status:</h2>
            <p className={status === "authenticated" ? "text-green-600" : "text-red-600"}>
              {status === "loading" ? "⏳ Loading..." : 
               status === "authenticated" ? "✅ Authenticated" : 
               "❌ Not authenticated"}
            </p>
          </div>
          
          {session && (
            <>
              <div>
                <h2 className="font-semibold">User Data:</h2>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(session.user, null, 2)}
                </pre>
              </div>
              
              <div>
                <h2 className="font-semibold">Full Session:</h2>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            </>
          )}
          
          <div>
            <h2 className="font-semibold">Test Actions:</h2>
            <div className="space-y-2">
              <a href="/dashboard" className="block text-blue-600 hover:underline">
                → Try Dashboard Access
              </a>
              <a href="/api/auth/signout" className="block text-red-600 hover:underline">
                → Sign Out
              </a>
              <a href="/login" className="block text-green-600 hover:underline">
                → Login Page
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}