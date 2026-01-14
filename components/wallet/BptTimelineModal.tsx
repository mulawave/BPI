"use client";

import { useState, useEffect, useMemo } from "react";
import { FiX, FiFilter, FiDownload, FiSettings, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { 
  Coins, TrendingUp, TrendingDown, Search, Calendar, DollarSign, 
  CheckCircle, Clock, XCircle, Loader2, ArrowDown, ArrowUp,
  CreditCard, Youtube, Users, Award, ShoppingCart, ArrowRightLeft,
  RefreshCw, AlertCircle, BarChart3, Receipt, Sparkles, Gift, Download
} from "lucide-react";
import { api } from "@/client/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import toast from "react-hot-toast";

interface BptTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'infinite' | 'pagination' | 'hybrid';
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type DateRange = 'last-7' | 'last-30' | 'last-90' | 'this-year' | 'all' | 'custom';

export default function BptTimelineModal({ isOpen, onClose }: BptTimelineModalProps) {
  const { formatAmount } = useCurrency();
  
  // User preferences
  const { data: userProfile } = api.user.getDetails.useQuery();
  
  // Settings panel state
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  
  // View mode and filter states
  const [viewMode, setViewMode] = useState<ViewMode>('infinite');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [dateRange, setDateRange] = useState<DateRange>('last-30');
  const [transactionType, setTransactionType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Custom date range
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Amount filter
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  
  // Search term
  const [searchTerm, setSearchTerm] = useState('');
  
  // Collapsed days tracking
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  
  // Load saved preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedViewMode = localStorage.getItem('bptTimelineViewMode') as ViewMode;
      const savedSort = localStorage.getItem('bptTimelineDefaultSort') as SortOption;
      const savedDateRange = localStorage.getItem('bptTimelineDateRange') as DateRange;
      
      if (savedViewMode) setViewMode(savedViewMode);
      if (savedSort) setSortOption(savedSort);
      if (savedDateRange) setDateRange(savedDateRange);
    }
  }, []);
  
  // Calculate date range (memoized so the query key doesn't change every render)
  const { dateFrom, dateTo } = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    switch (dateRange) {
      case 'last-7':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'last-30':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'last-90':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'this-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            dateFrom: new Date(customStartDate),
            dateTo: new Date(customEndDate),
          };
        }
        startDate.setDate(now.getDate() - 30);
        break;
      case 'all':
      default:
        startDate.setFullYear(now.getFullYear() - 2);
        break;
    }

    return {
      dateFrom: startDate,
      dateTo: now,
    };
  }, [dateRange, customStartDate, customEndDate]);
  
  // Fetch BPT transactions (only BPI Token types)
  const queryParams = useMemo(() => ({
    limit: 30,
    dateFrom,
    dateTo,
    walletType: 'bpiToken' as const,
    ...(transactionType !== 'all' && { transactionType: transactionType as 'debit' | 'credit' }),
    ...(statusFilter !== 'all' && { status: statusFilter as 'completed' | 'pending' | 'failed' }),
    ...(minAmount && { minAmount: parseFloat(minAmount) }),
    ...(maxAmount && { maxAmount: parseFloat(maxAmount) }),
    ...(searchTerm && { searchTerm }),
  }), [dateFrom, dateTo, transactionType, statusFilter, minAmount, maxAmount, searchTerm]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = api.dashboard.getWalletTimeline.useInfiniteQuery(
    queryParams,
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: isOpen,
      refetchInterval: false,
      retry: false,
    }
  );
  
  // Get all BPT transactions (already filtered by walletType on server)
  const bptTransactions = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.transactions);
  }, [data]);
  
  // Save preferences
  const savePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      localStorage.setItem('bptTimelineViewMode', viewMode);
      localStorage.setItem('bptTimelineDefaultSort', sortOption);
      localStorage.setItem('bptTimelineDateRange', dateRange);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
    if (!bptTransactions.length) return;
    
    const headers = ["Date", "Type", "Description", "Amount (BPT)", "Status", "Reference"];
    
    const csvData = bptTransactions.map((tx: any) => [
      new Date(tx.createdAt).toLocaleDateString(),
      tx.transactionType,
      tx.description || '',
      tx.amount.toFixed(2),
      tx.status,
      tx.reference || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bpt-timeline-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('BPT timeline exported!');
  };
  
  // Get transaction icon and style
  const getTransactionStyle = (tx: any) => {
    const type = tx.transactionType.toLowerCase();
    
    if (type.includes('referral') || type.includes('bonus')) {
      return {
        icon: Gift,
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        textColor: 'text-purple-600 dark:text-purple-400',
        borderColor: 'border-purple-200 dark:border-purple-800'
      };
    }
    
    if (type.includes('purchase')) {
      return {
        icon: ShoppingCart,
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-600 dark:text-blue-400',
        borderColor: 'border-blue-200 dark:border-blue-800'
      };
    }
    
    if (type.includes('sale')) {
      return {
        icon: DollarSign,
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-600 dark:text-green-400',
        borderColor: 'border-green-200 dark:border-green-800'
      };
    }
    
    return {
      icon: Coins,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      borderColor: 'border-yellow-200 dark:border-yellow-800'
    };
  };
  
  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    bptTransactions.forEach((tx: any) => {
      const date = new Date(tx.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[date]) groups[date] = [];
      groups[date].push(tx);
    });
    
    return groups;
  }, [bptTransactions]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-bpi-dark-card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 text-white shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">BPT Wallet Timeline</h2>
                <p className="text-white/80 text-sm">
                  {bptTransactions.length} BPI Token transaction{bptTransactions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <FiSettings className="w-4 h-4" />
              </Button>
              <Button
                onClick={exportTimeline}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                disabled={bptTransactions.length === 0}
              >
                <FiDownload className="w-4 h-4" />
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <FiX className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Settings Panel */}
        {showSettingsPanel && (
          <div className="px-6 pb-4 border-t border-white/20">
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="text-xs font-medium text-white/80 mb-1 block">View Mode</label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as ViewMode)}
                  className="w-full px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <option value="infinite" className="bg-gray-800">Infinite Scroll</option>
                  <option value="pagination" className="bg-gray-800">Pagination</option>
                  <option value="hybrid" className="bg-gray-800">Hybrid</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-medium text-white/80 mb-1 block">Sort By</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="w-full px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <option value="date-desc" className="bg-gray-800">Newest First</option>
                  <option value="date-asc" className="bg-gray-800">Oldest First</option>
                  <option value="amount-desc" className="bg-gray-800">Highest Amount</option>
                  <option value="amount-asc" className="bg-gray-800">Lowest Amount</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-medium text-white/80 mb-1 block">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as DateRange)}
                  className="w-full px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <option value="last-7" className="bg-gray-800">Last 7 Days</option>
                  <option value="last-30" className="bg-gray-800">Last 30 Days</option>
                  <option value="last-90" className="bg-gray-800">Last 90 Days</option>
                  <option value="this-year" className="bg-gray-800">This Year</option>
                  <option value="all" className="bg-gray-800">All Time</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-3">
              <Button
                onClick={savePreferences}
                disabled={isSavingPreferences}
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
              >
                {isSavingPreferences ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save as Default'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-bpi-dark-card">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <AlertCircle className="w-16 h-16 mb-4 text-red-500" />
            <p className="text-lg font-medium">Failed to load BPT timeline</p>
            <p className="text-sm mt-1 max-w-md text-center">
              {(error as any)?.message || 'An unexpected error occurred while loading your BPT transactions.'}
            </p>
            <div className="mt-4">
              <Button
                onClick={() => refetch()}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Retry
              </Button>
            </div>
          </div>
        ) : bptTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Coins className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">No BPT transactions found</p>
            <p className="text-sm">Your BPI Token transaction history will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([date, transactions]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full border border-yellow-200 dark:border-yellow-800">
                    {date}
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
                </div>
                
                {/* Transactions */}
                <div className="space-y-3">
                  {transactions.map((tx: any) => {
                    const style = getTransactionStyle(tx);
                    const Icon = style.icon;
                    
                    return (
                      <div
                        key={tx.id}
                        className={`rounded-xl border-2 ${style.borderColor} bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 p-4 hover:shadow-lg transition-all`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl ${style.bgColor} flex items-center justify-center flex-shrink-0 shadow-md`}>
                            <Icon className={`w-6 h-6 ${style.textColor}`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className={`font-bold ${style.textColor} text-sm uppercase tracking-wider`}>
                                  {tx.transactionType}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                                  {tx.description || 'BPT Transaction'}
                                </p>
                              </div>
                              
                              <div className="text-right">
                                <p className={`text-xl font-bold ${style.textColor}`}>
                                  {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)} BPT
                                </p>
                                {tx.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500 ml-auto mt-1" />}
                                {tx.status === 'pending' && <Clock className="w-4 h-4 text-yellow-500 ml-auto mt-1" />}
                                {tx.status === 'failed' && <XCircle className="w-4 h-4 text-red-500 ml-auto mt-1" />}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              {tx.reference && (
                                <span>Ref: {tx.reference}</span>
                              )}
                              <div className="flex items-center gap-2 ml-auto">
                                {/* Download Receipt Button - Only for completed withdrawals */}
                                {tx.status === 'completed' && tx.transactionType?.includes('WITHDRAWAL') && (
                                  <button
                                    onClick={() => {
                                      window.open(`/api/receipt/withdrawal/${tx.id}`, '_blank');
                                      toast.success('Opening receipt...');
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded text-[10px] font-medium transition-all shadow-sm hover:shadow-md"
                                    title="Download Receipt"
                                  >
                                    <Download className="w-3 h-3" />
                                    Receipt
                                  </button>
                                )}
                                <span>
                                  {new Date(tx.createdAt).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Load More */}
        {hasNextPage && (
          <div className="flex justify-center mt-6">
            <Button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
