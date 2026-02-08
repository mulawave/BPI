"use client";
import { signOut, useSession } from "next-auth/react";
import { resolveClientBaseUrl } from "@/lib/clientAppUrl";
import { api } from "@/client/trpc";
import { useState } from "react";

export default function DebugPage() {
  const { data: session, status } = useSession();
  const [backfillResult, setBackfillResult] = useState<any>(null);
  const [isBackfilling, setIsBackfilling] = useState(false);
  
  const backfillVatMutation = api.package.backfillMembershipVat.useMutation({
    onSuccess: (data) => {
      setBackfillResult(data);
      setIsBackfilling(false);
    },
    onError: (error) => {
      setBackfillResult({ success: false, message: error.message });
      setIsBackfilling(false);
    },
  });

  const handleBackfillVat = () => {
    setIsBackfilling(true);
    setBackfillResult(null);
    backfillVatMutation.mutate();
  };
  
  console.log("🔍 Client session data:", { session, status });
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">🔍 Client-Side Debug Information</h1>
        
        <div className="space-y-4">
          {/* VAT Backfill Tool */}
          <div className="border-t pt-4">
            <h2 className="font-semibold mb-2">🧾 VAT Backfill Tool:</h2>
            <p className="text-sm text-gray-600 mb-3">
              This will delete all existing VAT transactions and recreate them based on your actual membership payment history.
            </p>
            <button
              onClick={handleBackfillVat}
              disabled={isBackfilling || status !== "authenticated"}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isBackfilling ? "Processing..." : "Backfill VAT Transactions"}
            </button>
            
            {backfillResult && (
              <div className={`mt-3 p-3 rounded ${backfillResult.success ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                <p className="font-semibold">{backfillResult.message}</p>
                
                {/* Show diagnostic data */}
                {backfillResult.totalTransactions !== undefined && (
                  <div className="mt-3 text-sm">
                    <p><strong>Total Transactions:</strong> {backfillResult.totalTransactions}</p>
                    <p><strong>Membership Transactions Found:</strong> {backfillResult.membershipTransactionsFound}</p>
                    
                    {backfillResult.membershipTransactions && backfillResult.membershipTransactions.length > 0 && (
                      <div className="mt-3">
                        <p className="font-semibold">Membership Transactions:</p>
                        <div className="max-h-60 overflow-y-auto bg-white p-2 rounded mt-1">
                          {backfillResult.membershipTransactions.map((tx: any, idx: number) => (
                            <div key={idx} className="border-b py-2 text-xs">
                              <p><strong>Type:</strong> {tx.type}</p>
                              <p><strong>Amount:</strong> ₦{Math.abs(tx.amount).toFixed(2)}</p>
                              <p><strong>Description:</strong> {tx.description}</p>
                              <p><strong>Date:</strong> {new Date(tx.date).toLocaleString()}</p>
                              <p><strong>Reference:</strong> {tx.reference || 'N/A'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {backfillResult.allTransactions && backfillResult.allTransactions.length > 0 && (
                      <div className="mt-3">
                        <p className="font-semibold">All Transactions:</p>
                        <div className="max-h-80 overflow-y-auto bg-white p-2 rounded mt-1">
                          {backfillResult.allTransactions.map((tx: any, idx: number) => (
                            <div key={idx} className="border-b py-2 text-xs">
                              <p><strong>Type:</strong> {tx.type}</p>
                              <p><strong>Amount:</strong> ₦{tx.amount.toFixed(2)}</p>
                              <p><strong>Description:</strong> {tx.description}</p>
                              <p><strong>Date:</strong> {new Date(tx.date).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Show success results */}
                {backfillResult.success && backfillResult.records && (
                  <div className="mt-2 text-sm">
                    <p>Total VAT: ₦{backfillResult.totalVatAmount?.toFixed(2)}</p>
                    <div className="mt-2">
                      <p className="font-semibold">Records created:</p>
                      {backfillResult.records.map((record: any, idx: number) => (
                        <div key={idx} className="ml-4 mt-1">
                          <p>• {record.originalTransaction}</p>
                          <p className="ml-4 text-xs">Total Paid: ₦{record.totalPaid.toFixed(2)} → VAT: ₦{record.vatAmount.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
              <button
                onClick={() => signOut({ callbackUrl: `${resolveClientBaseUrl()}/login` })}
                className="block text-left text-red-600 hover:underline"
              >
                → Sign Out
              </button>
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