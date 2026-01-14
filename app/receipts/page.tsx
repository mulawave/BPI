"use client";

import { useState } from 'react';
import { api } from '@/client/trpc';
import { useCurrency } from '@/contexts/CurrencyContext';
import { motion } from 'framer-motion';
import { Download, FileText, Calendar, Filter, Search, ChevronDown, Loader2 } from 'lucide-react';
import { FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

type FilterType = 'all' | 'deposits' | 'withdrawals';

export default function ReceiptsPage() {
  const { formatAmount } = useCurrency();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');

  // Fetch all transactions
  const { data: transactions, isLoading } = api.dashboard.getWalletTimeline.useInfiniteQuery(
    { limit: 100 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const allTransactions = transactions?.pages.flatMap(page => page.transactions) || [];

  // Filter transactions that have receipts (completed deposits and withdrawals)
  const transactionsWithReceipts = allTransactions.filter(tx => 
    tx.status === 'completed' && 
    (tx.transactionType === 'DEPOSIT' || 
     tx.transactionType === 'WITHDRAWAL_CASH' || 
     tx.transactionType === 'WITHDRAWAL_BPT')
  );

  // Apply filters
  const filteredTransactions = transactionsWithReceipts.filter(tx => {
    // Type filter
    if (filterType === 'deposits' && tx.transactionType !== 'DEPOSIT') return false;
    if (filterType === 'withdrawals' && !tx.transactionType.includes('WITHDRAWAL')) return false;

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        tx.reference?.toLowerCase().includes(searchLower) ||
        tx.description?.toLowerCase().includes(searchLower) ||
        tx.id.toLowerCase().includes(searchLower)
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const txDate = new Date(tx.createdAt);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          return txDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return txDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return txDate >= monthAgo;
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          return txDate >= yearAgo;
      }
    }

    return true;
  });

  const downloadReceipt = (tx: any) => {
    const receiptType = tx.transactionType === 'DEPOSIT' ? 'deposit' : 'withdrawal';
    window.open(`/api/receipt/${receiptType}/${tx.id}`, '_blank');
    toast.success('Opening receipt...');
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'DEPOSIT') return '↓';
    if (type.includes('WITHDRAWAL')) return '↑';
    return '•';
  };

  const getTransactionColor = (type: string) => {
    if (type === 'DEPOSIT') return 'text-green-600 dark:text-green-400';
    if (type.includes('WITHDRAWAL')) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-green-600" />
            Transaction Receipts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Download receipts for all your completed transactions
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by reference, ID, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Transaction Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Types</option>
                <option value="deposits">Deposits Only</option>
                <option value="withdrawals">Withdrawals Only</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {transactionsWithReceipts.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Receipts</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4 border border-green-200 dark:border-green-700">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {transactionsWithReceipts.filter(tx => tx.transactionType === 'DEPOSIT').length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Deposit Receipts</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-lg p-4 border border-red-200 dark:border-red-700">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {transactionsWithReceipts.filter(tx => tx.transactionType.includes('WITHDRAWAL')).length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Withdrawal Receipts</div>
            </div>
          </div>
        </div>

        {/* Receipts List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading receipts...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Receipts Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || dateFilter !== 'all' || filterType !== 'all'
                ? "Try adjusting your filters to see more results"
                : "Complete a deposit or withdrawal transaction to see receipts here"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between">
                  {/* Left: Transaction Info */}
                  <div className="flex items-center gap-4 flex-1">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${
                      tx.transactionType === 'DEPOSIT' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    }`}>
                      {getTransactionIcon(tx.transactionType)}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {tx.transactionType === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                        </h3>
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full flex items-center gap-1">
                          <FiCheckCircle className="w-3 h-3" />
                          Completed
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(tx.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {tx.reference && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            Ref: {tx.reference}
                          </span>
                        )}
                      </div>
                      {tx.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {tx.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount & Download */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getTransactionColor(tx.transactionType)}`}>
                        {tx.transactionType === 'DEPOSIT' ? '+' : '-'}
                        {formatAmount(Math.abs(tx.amount))}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Transaction ID: {tx.id.slice(0, 8)}...
                      </div>
                    </div>

                    {/* Download Button */}
                    <button
                      onClick={() => downloadReceipt(tx)}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Receipt
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Showing count */}
        {!isLoading && filteredTransactions.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredTransactions.length} of {transactionsWithReceipts.length} receipts
          </div>
        )}
      </div>
    </div>
  );
}
