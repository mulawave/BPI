"use client";

import { useState, useEffect, useMemo } from "react";
import { FiX, FiFilter, FiDownload, FiSettings, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { 
  Wallet, TrendingUp, TrendingDown, Search, Calendar, DollarSign, 
  CheckCircle, Clock, XCircle, Loader2, ArrowDown, ArrowUp,
  CreditCard, Youtube, Users, Award, ShoppingCart, ArrowRightLeft,
  RefreshCw, AlertCircle, BarChart3, Receipt, Sparkles, Download
} from "lucide-react";
import { api } from "@/client/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import toast from "react-hot-toast";

interface WalletTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'infinite' | 'pagination' | 'hybrid';
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type DateRange = 'last-7' | 'last-30' | 'last-90' | 'this-year' | 'all' | 'custom';

export default function WalletTimelineModal({ isOpen, onClose }: WalletTimelineModalProps) {
  const { formatAmount } = useCurrency();
  
  // User preferences
  const { data: userProfile } = api.user.getDetails.useQuery();
  
  // Filters and settings
  const [viewMode, setViewMode] = useState<ViewMode>('infinite');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [dateRange, setDateRange] = useState<DateRange>('last-30');
  const [transactionType, setTransactionType] = useState<'all' | 'debit' | 'credit'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  
  // Load user preferences
  useEffect(() => {
    if (userProfile) {
      const profile = userProfile as any;
      if (profile.walletTimelineViewMode) {
        setViewMode(profile.walletTimelineViewMode as ViewMode);
      }
      if (profile.walletTimelineDefaultSort) {
        setSortOption(profile.walletTimelineDefaultSort as SortOption);
      }
      if (profile.walletTimelineDateRange) {
        setDateRange(profile.walletTimelineDateRange as DateRange);
      }
    }
  }, [userProfile]);
  
  // Calculate date range (memoized to prevent infinite loops)
  const { dateFrom, dateTo } = useMemo(() => {
    if (dateRange === 'custom') {
      return { dateFrom: customDateFrom, dateTo: customDateTo };
    }
    
    const now = new Date();
    const dateFrom = new Date();
    
    switch (dateRange) {
      case 'last-7':
        dateFrom.setDate(now.getDate() - 7);
        break;
      case 'last-30':
        dateFrom.setDate(now.getDate() - 30);
        break;
      case 'last-90':
        dateFrom.setDate(now.getDate() - 90);
        break;
      case 'this-year':
        dateFrom.setMonth(0, 1);
        break;
      case 'all':
        return { dateFrom: undefined, dateTo: undefined };
    }
    
    return { dateFrom, dateTo: now };
  }, [dateRange, customDateFrom, customDateTo]);
  
  // Fetch wallet timeline
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage,
    isFetchingNextPage 
  } = api.dashboard.getWalletTimeline.useInfiniteQuery(
    {
      limit: 30,
      dateFrom,
      dateTo,
      transactionType,
      status: statusFilter,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      searchTerm: searchTerm || undefined,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: isOpen,
    }
  );
  
  // Save preferences
  const savePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      // Save to localStorage
      localStorage.setItem('walletTimelineViewMode', viewMode);
      localStorage.setItem('walletTimelineDefaultSort', sortOption);
      localStorage.setItem('walletTimelineDateRange', dateRange);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('Preferences saved successfully');
      toast.success('Settings saved as default!');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSavingPreferences(false);
    }
  };
  
  // Export to CSV
  const exportTimeline = () => {
    if (!data?.pages) return;
    
    const allTransactions = data.pages.flatMap(page => page.transactions);
    const headers = ["Date", "Type", "Description", "Amount", "Balance", "Status", "Reference"];
    
    // Start from current balance and work backwards through transactions
    let runningBalance = data.pages[0]?.currentBalance || 0;
    const csvData = allTransactions.map((tx: any) => {
      const balanceAfter = runningBalance;
      runningBalance -= tx.amount; // Subtract to get balance before this transaction
      return [
        new Date(tx.createdAt).toLocaleString(),
        tx.transactionType,
        tx.description || "N/A",
        tx.amount,
        balanceAfter,
        tx.status,
        tx.reference || "N/A"
      ];
    });
    
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `wallet_timeline_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Get transaction icon and color
  const getTransactionStyle = (tx: any) => {
    const isVAT = tx.description?.includes('VAT');
    const isYouTube = tx.description?.includes('YouTube');
    const isMembership = tx.description?.includes('membership') || tx.description?.includes('MEMBERSHIP');
    const isReferral = tx.transactionType?.includes('REFERRAL');
    const isTransfer = tx.transactionType?.includes('TRANSFER');
    
    if (tx.transactionType === 'debit' || tx.amount < 0) {
      return {
        icon: isYouTube ? Youtube : isMembership ? Award : isVAT ? CreditCard : TrendingDown,
        color: 'red',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        textColor: 'text-red-600 dark:text-red-400',
        borderColor: 'border-red-200 dark:border-red-800',
      };
    } else if (tx.transactionType === 'credit' || tx.amount > 0) {
      return {
        icon: isReferral ? Users : isYouTube ? Youtube : TrendingUp,
        color: 'green',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-600 dark:text-green-400',
        borderColor: 'border-green-200 dark:border-green-800',
      };
    } else {
      return {
        icon: ArrowRightLeft,
        color: 'blue',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-600 dark:text-blue-400',
        borderColor: 'border-blue-200 dark:border-blue-800',
      };
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };
  
  // Group transactions by day
  const groupByDay = (transactions: any[]) => {
    const groups: { [key: string]: any[] } = {};
    
    transactions.forEach(tx => {
      const date = new Date(tx.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(tx);
    });
    
    return groups;
  };
  
  // Toggle day collapse
  const toggleDayCollapse = (day: string) => {
    const newSet = new Set(collapsedDays);
    if (newSet.has(day)) {
      newSet.delete(day);
    } else {
      newSet.add(day);
    }
    setCollapsedDays(newSet);
  };
  
  if (!isOpen) return null;
  
  const allTransactions = data?.pages.flatMap(page => page.transactions) || [];
  const currentBalance = data?.pages[0]?.currentBalance || 0;
  
  // Filter out BPT wallet transactions (they belong to a separate BPT wallet timeline)
  const mainWalletTransactions = allTransactions.filter((tx: any) => {
    const txType = tx.transactionType?.toLowerCase() || '';
    // Exclude BPT-related transactions: REFERRAL_BPT_L1-L10, BPI_TOKEN purchases, etc.
    return !txType.includes('referral_bpt') && 
           !txType.includes('bpi_token') && 
           !txType.includes('token_purchase') &&
           !txType.includes('token_sale');
  });
  
  // Calculate running balances and identify VAT relationships
  let runningBalance = currentBalance;
  const transactionsWithBalance = mainWalletTransactions.map((tx: any, index: number) => {
    const balanceAfter = runningBalance;
    const balanceBefore = runningBalance - tx.amount;
    runningBalance = balanceBefore;
    
    // Check if this is a VAT transaction (follows a main transaction)
    const isVAT = tx.description?.toLowerCase().includes('vat');
    let parentTxId = null;
    
    if (isVAT && index > 0) {
      // VAT transactions immediately follow their parent transaction
      const previousTx = mainWalletTransactions[index - 1];
      if (!previousTx.description?.toLowerCase().includes('vat')) {
        parentTxId = previousTx.id;
      }
    }
    
    return { ...tx, balanceAfter, balanceBefore, isVAT, parentTxId };
  });
  
  // Group transactions by day (excluding VAT children as they'll be nested)
  const mainTransactions = transactionsWithBalance.filter((tx: any) => !tx.parentTxId);
  const groupedWithBalance = groupByDay(mainTransactions);
  
  // Calculate analytics data
  const totalInflow = transactionsWithBalance
    .filter((tx: any) => tx.amount > 0)
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);
  
  const totalOutflow = transactionsWithBalance
    .filter((tx: any) => tx.amount < 0)
    .reduce((sum: number, tx: any) => sum + Math.abs(tx.amount), 0);
  
  const netChange = totalInflow - totalOutflow;
  
  // Category breakdown with proper types
  const categoryData: Record<string, number> = transactionsWithBalance.reduce((acc: Record<string, number>, tx: any) => {
    if (tx.isVAT) return acc; // Skip VAT for category totals
    const category = tx.transactionType || 'Other';
    if (!acc[category]) acc[category] = 0;
    acc[category] += Math.abs(tx.amount);
    return acc;
  }, {});
  
  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-bpi-dark-card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Wallet Timeline</h2>
                <p className="text-sm text-white/80">Track your money flow</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FiFilter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={exportTimeline}
                disabled={!allTransactions.length}
              >
                <FiDownload className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setShowSettings(!showSettings)}
              >
                <FiSettings className="w-4 h-4" />
              </Button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
              <Input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-bpi-dark-accent border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as DateRange)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-green-800/50 rounded-lg bg-white dark:bg-bpi-dark-card text-sm"
                >
                  <option value="last-7">Last 7 Days</option>
                  <option value="last-30">Last 30 Days</option>
                  <option value="last-90">Last 90 Days</option>
                  <option value="this-year">This Year</option>
                  <option value="all">All Time</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              
              {/* Transaction Type */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                  Type
                </label>
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-green-800/50 rounded-lg bg-white dark:bg-bpi-dark-card text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="debit">Debits (Outflow)</option>
                  <option value="credit">Credits (Inflow)</option>
                </select>
              </div>
              
              {/* Status */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-green-800/50 rounded-lg bg-white dark:bg-bpi-dark-card text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              
              {/* Sort */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                  Sort By
                </label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-green-800/50 rounded-lg bg-white dark:bg-bpi-dark-card text-sm"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="amount-desc">Highest Amount</option>
                  <option value="amount-asc">Lowest Amount</option>
                </select>
              </div>
              
              {/* Min Amount */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                  Min Amount
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="text-sm"
                />
              </div>
              
              {/* Max Amount */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                  Max Amount
                </label>
                <Input
                  type="number"
                  placeholder="No limit"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              View Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                  View Mode
                </label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as ViewMode)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-green-800/50 rounded-lg bg-white dark:bg-bpi-dark-card text-sm"
                >
                  <option value="infinite">Infinite Scroll</option>
                  <option value="pagination">Pagination</option>
                  <option value="hybrid">Hybrid (Date Sections)</option>
                </select>
              </div>
            </div>
            <Button
              onClick={savePreferences}
              size="sm"
              className="mt-3"
              disabled={isSavingPreferences}
            >
              {isSavingPreferences ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save as Default'
              )}
            </Button>
          </div>
        </div>
      )}
      
      {/* Timeline Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-bpi-primary animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading timeline...</p>
          </div>
        ) : allTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Wallet className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              No Transactions Found
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full px-6 py-6">
            {/* Left Column: Timeline (2/3 width) */}
            <div className="lg:col-span-2 overflow-y-auto pr-4">
              <div className="space-y-6">
                {/* Current Balance Card */}
                <div className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-2xl border border-slate-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80 font-medium tracking-wide">Current Balance</p>
                      <p className="text-4xl font-bold mt-2 bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-300">{formatAmount(currentBalance)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-teal-400 to-cyan-400 p-3 rounded-xl">
                      <Wallet className="w-8 h-8 text-slate-900" />
                    </div>
                  </div>
                </div>
                
                {/* Timeline */}
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" />
                  
                  {Object.entries(groupedWithBalance).map(([day, transactions]: [string, any[]], dayIndex) => {
                    const isDayCollapsed = collapsedDays.has(day);
                    const dayTotal = transactions.reduce((sum, tx) => sum + tx.amount, 0);
                    
                    return (
                      <div key={day} className="mb-8">
                        {/* Separator Line for Collapsed Days */}
                        {dayIndex > 0 && isDayCollapsed && (
                          <div className="mb-6 -mt-2">
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                          </div>
                        )}
                        
                        {/* Day Header */}
                        <button
                          onClick={() => toggleDayCollapse(day)}
                          className="flex items-center gap-3 mb-4 w-full hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 dark:hover:from-teal-900/20 dark:hover:to-cyan-900/20 p-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{day}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} • 
                              <span className={dayTotal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                {' '}{dayTotal >= 0 ? '+' : ''}{formatAmount(dayTotal)}
                              </span>
                            </p>
                          </div>
                          {isDayCollapsed ? <FiChevronDown className="w-5 h-5" /> : <FiChevronUp className="w-5 h-5" />}
                        </button>
                        
                        {/* Transactions */}
                        {!isDayCollapsed && (
                          <div className="space-y-4 ml-12">
                            {transactions.map((tx: any, txIndex: number) => {
                              const style = getTransactionStyle(tx);
                              const Icon = style.icon;
                              const isVAT = tx.description?.toLowerCase().includes('vat');
                              
                              // Find VAT children for this transaction
                              const vatChildren = isVAT ? [] : transactions.filter((t: any) => t.parentTxId === tx.id);
                              
                              // Skip if this is a VAT child (will be rendered under parent)
                              if (tx.parentTxId) return null;
                              
                              return (
                                <div key={tx.id} className="relative">
                                  {/* Main Transaction */}
                                  <div className={`rounded-xl border-2 ${style.borderColor} bg-white dark:bg-bpi-dark-card p-4 shadow-md hover:shadow-lg transition-shadow`}>
                                    <div className="flex items-start gap-4">
                                      {/* Icon */}
                                      <div className={`w-12 h-12 rounded-xl ${style.bgColor} flex items-center justify-center flex-shrink-0`}>
                                        <Icon className={`w-6 h-6 ${style.textColor}`} />
                                      </div>
                                      
                                      {/* Details */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                          <div>
                                            <p className={`font-semibold ${style.textColor} text-sm uppercase tracking-wide`}>
                                              {tx.transactionType}
                                            </p>
                                            <p className="text-gray-700 dark:text-gray-300 font-medium mt-1">
                                              {tx.description || 'Transaction'}
                                            </p>
                                          </div>
                                          
                                          <div className="text-right">
                                            <p className={`text-xl font-bold ${style.textColor}`}>
                                              {tx.amount >= 0 ? '+' : ''}{formatAmount(tx.amount)}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        {/* Balance Flow */}
                                        <div className="flex items-center gap-3 mt-3 p-3 bg-gray-50 dark:bg-bpi-dark-accent rounded-lg">
                                          <div className="flex-1">
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Balance Before</p>
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatAmount(tx.balanceBefore)}</p>
                                          </div>
                                          <div className="text-gray-400">→</div>
                                          <div className="flex-1 text-right">
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Balance After</p>
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatAmount(tx.balanceAfter)}</p>
                                          </div>
                                        </div>
                                        
                                        {/* Status & Reference Row */}
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                          <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                              {getStatusIcon(tx.status)}
                                              <span className="text-sm capitalize text-gray-600 dark:text-gray-400">
                                                {tx.status}
                                              </span>
                                            </div>
                                            
                                            {tx.reference && (
                                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                                Ref: {tx.reference}
                                              </span>
                                            )}
                                          </div>
                                          
                                          <div className="flex items-center gap-3">
                                            {/* Download Receipt Button - Only show for completed deposits/withdrawals */}
                                            {tx.status === 'completed' && (tx.transactionType === 'DEPOSIT' || tx.transactionType.includes('WITHDRAWAL')) && (
                                              <button
                                                onClick={() => {
                                                  const receiptType = tx.transactionType === 'DEPOSIT' ? 'deposit' : 'withdrawal';
                                                  window.open(`/api/receipt/${receiptType}/${tx.id}`, '_blank');
                                                  toast.success('Opening receipt...');
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg text-xs font-medium transition-all shadow-sm hover:shadow-md"
                                                title="Download Receipt"
                                              >
                                                <Download className="w-3.5 h-3.5" />
                                                Receipt
                                              </button>
                                            )}
                                            
                                            <div className="text-xs text-gray-500 dark:text-gray-500">
                                              {new Date(tx.createdAt).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* VAT Children */}
                                  {vatChildren.length > 0 && (
                                    <div className="mt-3 ml-4 space-y-2.5 relative">
                                      {/* Vertical connector line - starts from parent card */}
                                      <div className="absolute left-3 -top-3 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-amber-300 to-transparent opacity-60" />
                                      
                                      {vatChildren.map((vatTx: any, vIndex: number) => {
                                        const vatStyle = getTransactionStyle(vatTx);
                                        const VatIcon = vatStyle.icon;
                                        const isLastVat = vIndex === vatChildren.length - 1;
                                        
                                        return (
                                          <div key={vatTx.id} className="relative pl-8">
                                            {/* Horizontal connector (L-shape from vertical line) */}
                                            <div className="absolute left-3 top-1/2 w-5 h-px bg-gradient-to-r from-amber-400 to-amber-300 opacity-60" />
                                            <div className="absolute left-3 top-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full -ml-px -mt-px shadow-sm" />
                                            
                                            <div className={`rounded-lg border ${vatStyle.borderColor} bg-gradient-to-br from-amber-50/80 to-yellow-50/60 dark:from-amber-900/20 dark:to-yellow-900/10 p-3 shadow-sm hover:shadow-md transition-all backdrop-blur-sm scale-95`}>
                                              <div className="flex items-start gap-2.5">
                                                {/* Icon - smaller for child */}
                                                <div className={`w-8 h-8 rounded-lg ${vatStyle.bgColor} flex items-center justify-center flex-shrink-0 shadow-sm ring-1 ring-amber-200 dark:ring-amber-800`}>
                                                  <VatIcon className={`w-4 h-4 ${vatStyle.textColor}`} />
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-start justify-between gap-3 mb-1.5">
                                                    <div>
                                                      <div className="flex items-center gap-1.5">
                                                        <p className={`font-semibold ${vatStyle.textColor} text-[10px] uppercase tracking-wide`}>{vatTx.transactionType}</p>
                                                        <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[9px] font-bold rounded-full border border-amber-300 dark:border-amber-700">VAT</span>
                                                      </div>
                                                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5 font-medium">{vatTx.description || 'VAT Transaction'}</p>
                                                    </div>
                                                    
                                                    <div className="text-right">
                                                      <p className={`text-base font-bold ${vatStyle.textColor}`}>{vatTx.amount >= 0 ? '+' : ''}{formatAmount(vatTx.amount)}</p>
                                                    </div>
                                                  </div>
                                                  
                                                  {/* VAT Balance Flow - compact */}
                                                  <div className="flex items-center gap-1.5 mt-2 p-2 bg-white/80 dark:bg-slate-900/40 rounded border border-amber-200/50 dark:border-amber-800/30 shadow-inner">
                                                    <div className="flex-1">
                                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Before</p>
                                                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatAmount(vatTx.balanceBefore)}</p>
                                                    </div>
                                                    <div className="text-amber-400 text-xs font-bold">→</div>
                                                    <div className="flex-1 text-right">
                                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">After</p>
                                                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatAmount(vatTx.balanceAfter)}</p>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Load More Button */}
                {hasNextPage && (
                  <div className="flex justify-center pt-6">
                    <Button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      variant="outline"
                      size="lg"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading More...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Load More Transactions
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column: Analytics (1/3 width) */}
            <div className="lg:col-span-1 overflow-y-auto border-l border-gray-200 dark:border-gray-700 pl-6">
              <div className="space-y-6">
                {/* Summary Stats */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Summary
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Total Inflow */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl p-4 border-2 border-emerald-200 dark:border-emerald-800 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="bg-emerald-500 p-1.5 rounded-lg">
                            <ArrowUp className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Inflow</p>
                        </div>
                        <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                          +{formatAmount(totalInflow)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Total Outflow */}
                    <div className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/30 dark:to-red-900/30 rounded-xl p-4 border-2 border-rose-200 dark:border-rose-800 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="bg-rose-500 p-1.5 rounded-lg">
                            <ArrowDown className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Outflow</p>
                        </div>
                        <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-red-600 dark:from-rose-400 dark:to-red-400">
                          -{formatAmount(totalOutflow)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Net Change */}
                    <div className={`rounded-xl p-4 border-2 shadow-sm ${
                      netChange >= 0 
                        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-800' 
                        : 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-amber-200 dark:border-amber-800'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${netChange >= 0 ? 'bg-blue-500' : 'bg-amber-500'}`}>
                            <TrendingUp className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Net Change</p>
                        </div>
                        <p className={`text-xl font-bold ${
                          netChange >= 0 
                            ? 'bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400' 
                            : 'bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400'
                        }`}>
                          {netChange >= 0 ? '+' : ''}{formatAmount(netChange)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Transaction Count */}
                <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Transactions</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">{mainTransactions.length}</p>
                </div>
                
                {/* Category Breakdown */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    By Category
                  </h3>
                  
                  <div className="space-y-2">
                    {Object.entries(categoryData)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 10)
                      .map(([category, amount]) => {
                        const amountNum = amount as number;
                        const percentage = totalInflow + totalOutflow > 0 
                          ? (amountNum / (totalInflow + totalOutflow)) * 100 
                          : 0;
                        
                        return (
                          <div key={category} className="bg-white dark:bg-bpi-dark-card rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider truncate">
                                {category}
                              </p>
                              <p className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                                {formatAmount(amountNum)}
                              </p>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                              <div 
                                className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {percentage.toFixed(1)}% of total volume
                              </p>
                              {/* Mini bar indicator */}
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1 rounded-full transition-all ${
                                      i < Math.ceil((percentage / 100) * 5)
                                        ? 'h-3 bg-gradient-to-t from-purple-500 to-pink-500'
                                        : 'h-2 bg-slate-200 dark:bg-slate-700'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
                
                {/* Quick Insights */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                    Insights
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Average Transaction */}
                    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg p-3 border border-cyan-200 dark:border-cyan-800">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Avg Transaction</p>
                      <p className="text-lg font-bold text-cyan-700 dark:text-cyan-400">
                        {mainTransactions.length > 0 
                          ? formatAmount((totalInflow + totalOutflow) / mainTransactions.length)
                          : formatAmount(0)}
                      </p>
                    </div>
                    
                    {/* Largest Inflow */}
                    {(() => {
                      const largestInflow = mainTransactions
                        .filter(tx => tx.amount > 0)
                        .sort((a, b) => b.amount - a.amount)[0];
                      
                      return largestInflow ? (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Largest Inflow</p>
                          <p className="text-lg font-bold text-green-700 dark:text-green-400">
                            +{formatAmount(largestInflow.amount)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
                            {largestInflow.description}
                          </p>
                        </div>
                      ) : null;
                    })()}
                    
                    {/* Largest Outflow */}
                    {(() => {
                      const largestOutflow = mainTransactions
                        .filter(tx => tx.amount < 0)
                        .sort((a, b) => a.amount - b.amount)[0];
                      
                      return largestOutflow ? (
                        <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Largest Outflow</p>
                          <p className="text-lg font-bold text-red-700 dark:text-red-400">
                            {formatAmount(largestOutflow.amount)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
                            {largestOutflow.description}
                          </p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
