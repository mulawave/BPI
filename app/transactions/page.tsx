"use client";
import { api } from "@/client/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowLeft, Search, Filter, Download, CreditCard, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import LoadingScreen from "@/components/LoadingScreen";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function TransactionsPage() {
  const { data: transactions, isLoading } = api.dashboard.getAllTransactions.useQuery();
  const { theme } = useTheme();
  const { formatAmount } = useCurrency();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDirection, setFilterDirection] = useState<"all" | "inflow" | "outflow">("all");
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  // Export transactions to CSV
  const exportTransactions = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const headers = ["Date", "Reference", "Type", "Description", "Amount", "Status"];
    const csvData = filteredTransactions.map((tx: any) => [
      new Date(tx.createdAt).toLocaleString(),
      tx.reference || "N/A",
      tx.transactionType,
      tx.description || "N/A",
      isBptTransaction(tx) ? `${tx.amount} BPT` : formatAmount(tx.amount),
      tx.status
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter transactions based on search and filters
  const filteredTransactions = transactions?.filter((tx: any) => {
    const matchesSearch = 
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.transactionType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || tx.status === filterStatus;
    const matchesType = filterType === "all" || tx.transactionType === filterType;
    
    // Direction filter
    const isInflow = tx.transactionType === "credit" ||
                     tx.transactionType.includes("REFERRAL") || 
                     tx.transactionType.includes("bonus") || 
                     tx.transactionType.includes("deposit") || 
                     tx.transactionType.includes("payment_received") ||
                     tx.transactionType.includes("REWARD");
    
    const isOutflow = tx.transactionType === "debit" ||
                      tx.transactionType.includes("withdrawal") || 
                      tx.transactionType.includes("WITHDRAWAL") ||
                      tx.transactionType.includes("membership") ||
                      tx.transactionType.includes("MEMBERSHIP") ||
                      tx.transactionType.includes("payment") || 
                      tx.transactionType.includes("transfer") ||
                      tx.transactionType.includes("TRANSFER") ||
                      tx.transactionType.includes("upgrade") ||
                      tx.transactionType.includes("UPGRADE") ||
                      tx.transactionType.includes("purchase") ||
                      tx.transactionType.includes("CONVERT_TO_CONTACT");
    
    const matchesDirection = 
      filterDirection === "all" || 
      (filterDirection === "inflow" && isInflow) ||
      (filterDirection === "outflow" && isOutflow);
    
    return matchesSearch && matchesStatus && matchesType && matchesDirection;
  });

  // Get unique transaction types for filter
  const transactionTypes = Array.from(new Set(transactions?.map((tx: any) => tx.transactionType) || []));

  // Helper function to check if transaction is BPT
  const isBptTransaction = (tx: any) => {
    return tx.transactionType === 'CONVERT_TO_CONTACT' || 
           tx.transactionType.includes('REFERRAL_BPT_L');
  };

  // BPT conversion rate (5 naira per BPT)
  const BPT_CONVERSION_RATE = 5;

  // Calculate summary stats
  const totalPending = filteredTransactions?.filter((tx: any) => tx.status === "pending").length || 0;
  const totalFailed = filteredTransactions?.filter((tx: any) => tx.status === "failed").length || 0;
  
  // Inflow transactions: earnings, referrals, bonuses, deposits, received payments, credits
  const inflowTransactions = filteredTransactions?.filter((tx: any) => 
    tx.status === "completed" && 
    (tx.transactionType === "credit" ||
     tx.transactionType.includes("REFERRAL") || 
     tx.transactionType.includes("bonus") || 
     tx.transactionType.includes("deposit") || 
     tx.transactionType.includes("payment_received") ||
     tx.transactionType.includes("REWARD"))
  ) || [];
  
  // Separate BPT and cash for inflow
  const inflowBptTransactions = inflowTransactions.filter(isBptTransaction);
  const inflowCashTransactions = inflowTransactions.filter(tx => !isBptTransaction(tx));
  const totalInflowBpt = inflowBptTransactions.reduce((sum, tx: any) => sum + tx.amount, 0);
  const totalInflowCash = inflowCashTransactions.reduce((sum, tx: any) => sum + tx.amount, 0);
  const totalInflow = totalInflowCash + (totalInflowBpt * BPT_CONVERSION_RATE);
  const totalInflowCount = inflowTransactions.length;
    
  // Outflow transactions: withdrawals, payments, transfers, purchases, membership costs, debits
  const outflowTransactions = filteredTransactions?.filter((tx: any) => 
    tx.status === "completed" && 
    (tx.transactionType === "debit" ||
     tx.transactionType.includes("withdrawal") || 
     tx.transactionType.includes("WITHDRAWAL") ||
     tx.transactionType.includes("membership") ||
     tx.transactionType.includes("MEMBERSHIP") ||
     tx.transactionType.includes("payment") || 
     tx.transactionType.includes("transfer") ||
     tx.transactionType.includes("TRANSFER") ||
     tx.transactionType.includes("upgrade") ||
     tx.transactionType.includes("UPGRADE") ||
     tx.transactionType.includes("purchase") ||
     tx.transactionType.includes("CONVERT_TO_CONTACT"))
  ) || [];
  
  // Separate BPT and cash for outflow
  const outflowBptTransactions = outflowTransactions.filter(isBptTransaction);
  const outflowCashTransactions = outflowTransactions.filter(tx => !isBptTransaction(tx));
  const totalOutflowBpt = Math.abs(outflowBptTransactions.reduce((sum, tx: any) => sum + tx.amount, 0));
  const totalOutflowCash = Math.abs(outflowCashTransactions.reduce((sum, tx: any) => sum + tx.amount, 0));
  const totalOutflow = totalOutflowCash + (totalOutflowBpt * BPT_CONVERSION_RATE);
  const totalOutflowCount = outflowTransactions.length;

  if (isLoading) {
    return (
      <LoadingScreen 
        message="Loading Transactions"
        subtitle="Fetching your transaction history..."
      />
    );
  }

  return (
    <div className="min-h-screen bg-bpi-gradient-light dark:bg-bpi-gradient-dark">
      {/* Header */}
      <header className="bg-white/80 dark:bg-bpi-dark-card/80 backdrop-blur-md border-b border-bpi-border dark:border-bpi-dark-accent shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => {
                  setIsDashboardLoading(true);
                  router.push('/dashboard');
                }}
                disabled={isDashboardLoading}
              >
                {isDashboardLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <>
                    <ArrowLeft className="w-4 h-4" />
                    <span>Dashboard</span>
                  </>
                )}
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-bpi-primary to-bpi-secondary bg-clip-text text-transparent">Transaction History</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={exportTransactions}
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card 
            className={`p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 cursor-pointer hover:shadow-lg transition-all ${filterDirection === 'inflow' ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => setFilterDirection(filterDirection === 'inflow' ? 'all' : 'inflow')}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider">Total Inflow</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-300 mt-1">{formatAmount(totalInflow)}</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">{totalInflowCount} completed</p>
                {totalInflowBpt > 0 && (
                  <p className="text-xs text-green-500 dark:text-green-400 mt-2 text-right">
                    {totalInflowBpt.toFixed(2)} BPT ({BPT_CONVERSION_RATE}/BPT)
                  </p>
                )}
              </div>
              <TrendingUp className="w-10 h-10 text-green-600 dark:text-green-400 opacity-50" />
            </div>
          </Card>

          <Card 
            className={`p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-lg transition-all ${filterDirection === 'outflow' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setFilterDirection(filterDirection === 'outflow' ? 'all' : 'outflow')}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Total Outflow</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-300 mt-1">{formatAmount(totalOutflow)}</p>
                <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">{totalOutflowCount} completed</p>
                {totalOutflowBpt > 0 && (
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-2 text-right">
                    {totalOutflowBpt.toFixed(2)} BPT ({BPT_CONVERSION_RATE}/BPT)
                  </p>
                )}
              </div>
              <TrendingDown className="w-10 h-10 text-blue-600 dark:text-blue-400 opacity-50" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-bold text-orange-800 dark:text-orange-300 mt-1">{totalPending}</p>
                <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">awaiting processing</p>
              </div>
              <Clock className="w-10 h-10 text-orange-600 dark:text-orange-400 opacity-50" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Failed</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-300 mt-1">{totalFailed}</p>
                <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">unsuccessful attempts</p>
              </div>
              <XCircle className="w-10 h-10 text-gray-600 dark:text-gray-400 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-bpi-primary"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-bpi-primary"
            >
              <option value="all">All Types</option>
              {transactionTypes.map((type: any) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Transactions List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">All Transactions</h2>
          </div>

          {filteredTransactions && filteredTransactions.length > 0 ? (
            <div className="space-y-3">
              {filteredTransactions.map((tx: any) => {
                // Determine if transaction is inflow or outflow
                const isInflow = tx.transactionType.includes("REFERRAL") || 
                                 tx.transactionType.includes("bonus") || 
                                 tx.transactionType.includes("deposit") || 
                                 tx.transactionType.includes("payment_received") ||
                                 tx.transactionType.includes("REWARD");
                
                const isOutflow = tx.transactionType.includes("withdrawal") || 
                                  tx.transactionType.includes("WITHDRAWAL") ||
                                  tx.transactionType.includes("membership") ||
                                  tx.transactionType.includes("MEMBERSHIP") ||
                                  tx.transactionType.includes("payment") || 
                                  tx.transactionType.includes("transfer") ||
                                  tx.transactionType.includes("TRANSFER") ||
                                  tx.transactionType.includes("upgrade") ||
                                  tx.transactionType.includes("UPGRADE") ||
                                  tx.transactionType.includes("purchase") ||
                                  tx.transactionType.includes("CONVERT_TO_CONTACT");

                const getStatusIcon = () => {
                  if (tx.status === "completed") return <CheckCircle className="w-5 h-5 text-green-600" />;
                  if (tx.status === "pending") return <Clock className="w-5 h-5 text-orange-600" />;
                  if (tx.status === "failed") return <XCircle className="w-5 h-5 text-red-600" />;
                  return <AlertCircle className="w-5 h-5 text-gray-600" />;
                };

                const getStatusColor = () => {
                  if (tx.status !== "completed") {
                    if (tx.status === "pending") return "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800";
                    if (tx.status === "failed") return "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800";
                    return "bg-gray-100 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700";
                  }
                  
                  // For completed transactions, use green for inflow, blue for outflow
                  if (isInflow) return "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800";
                  if (isOutflow) return "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800";
                  return "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800";
                };

                return (
                  <div
                    key={tx.id}
                    className={`flex items-start justify-between p-4 rounded-xl border transition-all hover:shadow-md ${getStatusColor()}`}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 bg-white dark:bg-gray-900 rounded-lg">
                        {getStatusIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{tx.transactionType}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{tx.description}</p>
                        {tx.reference && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono">Ref: {tx.reference}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(tx.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        {isBptTransaction(tx)
                          ? `${tx.amount} BPT` 
                          : formatAmount(tx.amount)}
                      </p>
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                        tx.status === 'completed' ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        tx.status === 'pending' ? 'bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-semibold text-muted-foreground">No transactions found</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
