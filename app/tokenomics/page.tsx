"use client";
import { api } from "@/client/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function TokenomicsPage() {
  const { data, isLoading } = api.token.getPublicStats.useQuery();
  const { formatAmount } = useCurrency();

  if (isLoading) {
    return <div>Loading tokenomics data...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        BPI Token (BPT) Tokenomics
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Buy-Back Wallet</h2>
          <p className="text-3xl font-bold">
            {formatAmount(data?.buyBackWalletBalance ?? 0)}
          </p>
          <p className="text-sm text-gray-500">Value</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Total BPT Burned</h2>
          <p className="text-3xl font-bold">
            {(data?.totalBptBurned ?? 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">BPT</p>
        </div>
      </div>
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Burn History</h2>
        <div className="border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BPT Burned</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left textxs font-medium text-gray-500 uppercase tracking-wider">Tx Hash</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.burnHistory.map((event) => (
                <tr key={event.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(event.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{event.amountBpt.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatAmount(event.valueNgn)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{event.txHash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}