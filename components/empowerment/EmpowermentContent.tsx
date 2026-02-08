'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBookOpen,
  FiUsers,
  FiTrendingUp,
  FiClock,
  FiSearch,
  FiX,
  FiCreditCard,
  FiCheck,
  FiAlertCircle,
  FiCalendar,
  FiDollarSign,
  FiAward,
  FiTarget,
  FiPieChart,
  FiBarChart2,
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiRefreshCcw,
  FiShield,
  FiSend,
  FiCheckSquare,
  FiSquare,
  FiDownload,
} from 'react-icons/fi';
import { api } from '@/client/trpc';
import toast from 'react-hot-toast';
import AdminActivityTracker from '@/components/admin/AdminActivityTracker';

const PACKAGE_COST = 354750; // ₦330,000 + ₦24,750 VAT

type TabView = 'activate' | 'history' | 'analytics';
type StatusFilter = 'all' | 'active' | 'pending' | 'mature' | 'approved' | 'released' | 'fallback' | 'converted';
type EmpowermentType = 'CHILD_EDUCATION' | 'VOCATIONAL_SKILL';
type Gateway = 'wallet' | 'paystack' | 'flutterwave' | 'bank-transfer';

interface SelectedBeneficiary {
  id: string;
  name: string | null;
  email: string | null;
}

export default function EmpowermentContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isAdminView = pathname?.startsWith('/admin/empowerment');
  const [activeTab, setActiveTab] = useState<TabView>(isAdminView ? 'history' : 'activate');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<SelectedBeneficiary | null>(null);
  const [empowermentType, setEmpowermentType] = useState<EmpowermentType>('CHILD_EDUCATION');
  const [paymentGateway, setPaymentGateway] = useState<Gateway>('wallet');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [packageSearch, setPackageSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const formatAmount = (value: number) => `₦${value.toLocaleString()}`;
  const formatDate = (value?: Date | string | null) => {
    if (!value) return '—';
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleDateString();
  };

  const getStatusTone = (status: string) => {
    if (status.includes('Active')) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800';
    if (status.includes('Pending')) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800';
    if (status.includes('Approved')) return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800';
    if (status.includes('Released')) return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-800';
    if (status.includes('Fallback')) return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800';
    return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700';
  };

  const getProgress = (activatedAt?: Date | string | null, maturityDate?: Date | string | null) => {
    if (!activatedAt || !maturityDate) return 0;
    const start = typeof activatedAt === 'string' ? new Date(activatedAt).getTime() : activatedAt.getTime();
    const end = typeof maturityDate === 'string' ? new Date(maturityDate).getTime() : maturityDate.getTime();
    const now = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  };

  // Fetch data
  const { data: availableGateways } = api.payment.getPaymentGateways.useQuery();
  const { data: me } = api.user.getDetails.useQuery();
  const { data: empowermentPackages = [], isLoading: isLoadingPackages } = api.package.getMyEmpowermentPackages.useQuery();
  const utils = api.useUtils();
  const { data: searchResults, isLoading: isSearching } = api.user.searchUsers.useQuery(
    { term: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );

  // Mutations
  const activateEmpowerment = api.package.activateEmpowerment.useMutation({
    onSuccess: (data) => {
      if ('paymentUrl' in data && data.paymentUrl) {
        toast.success('Redirecting to payment gateway...');
        window.location.href = data.paymentUrl;
      } else {
        toast.success('🎓 Empowerment package activated successfully!');
        setSelectedBeneficiary(null);
        setSearchQuery('');
        setActiveTab('history');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to activate empowerment package');
    },
  });

  const verifyEmpowerment = api.package.verifyEmpowermentPayment.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success('✅ Payment verified! Empowerment package activated.');
        setActiveTab('history');
      } else {
        toast.error(data.message || 'Payment verification failed');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to verify payment');
    },
  });

  const checkMaturity = api.package.checkEmpowermentMaturity.useMutation({
    onSuccess: () => {
      toast.success('Package marked as mature. Awaiting approval.');
      utils.package.getMyEmpowermentPackages.invalidate();
    },
    onError: (error) => toast.error(error.message || 'Failed to mark maturity'),
  });

  const approveEmpowerment = api.package.approveEmpowerment.useMutation({
    onSuccess: () => {
      toast.success('Empowerment approved successfully.');
      utils.package.getMyEmpowermentPackages.invalidate();
    },
    onError: (error) => toast.error(error.message || 'Approval failed'),
  });

  const releaseFunds = api.package.releaseEmpowermentFunds.useMutation({
    onSuccess: () => {
      toast.success('Funds released successfully.');
      utils.package.getMyEmpowermentPackages.invalidate();
    },
    onError: (error) => toast.error(error.message || 'Release failed'),
  });

  const triggerFallback = api.package.triggerFallbackProtection.useMutation({
    onSuccess: () => {
      toast.success('Fallback protection activated.');
      utils.package.getMyEmpowermentPackages.invalidate();
    },
    onError: (error) => toast.error(error.message || 'Fallback activation failed'),
  });

  const convertToRegularPlus = api.package.convertToRegularPlus.useMutation({
    onSuccess: () => {
      toast.success('Converted to Regular Plus successfully.');
      utils.package.getMyEmpowermentPackages.invalidate();
    },
    onError: (error) => toast.error(error.message || 'Conversion failed'),
  });

  // Handle payment verification from redirect
  useEffect(() => {
    const gatewayParam = searchParams?.get('gateway');
    const reference = searchParams?.get('reference');

    if (gatewayParam && reference && (gatewayParam === 'paystack' || gatewayParam === 'flutterwave')) {
      verifyEmpowerment.mutate({ 
        gateway: gatewayParam as any, 
        reference 
      });
    }
  }, [searchParams]);

  const handleActivate = () => {
    if (!selectedBeneficiary) {
      toast.error('Please select a beneficiary');
      return;
    }

    if (paymentGateway === 'bank-transfer') {
      const params = new URLSearchParams({
        amount: String(PACKAGE_COST),
        purpose: 'empowerment',
        beneficiaryId: selectedBeneficiary.id,
        empowermentType,
        packageId: 'empowerment',
      });
      window.location.href = `/membership/payment/bank-transfer?${params.toString()}`;
      return;
    }

    activateEmpowerment.mutate({
      beneficiaryId: selectedBeneficiary.id,
      empowermentType,
      gateway: paymentGateway,
    });
  };

  const filteredPackages = useMemo(() => {
    const search = packageSearch.trim().toLowerCase();
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    return empowermentPackages.filter((pkg) => {
      const status = pkg.status || '';
      if (statusFilter === 'active' && !status.includes('Active')) return false;
      if (statusFilter === 'pending' && !status.includes('Pending')) return false;
      if (statusFilter === 'mature' && !status.includes('Maturity')) return false;
      if (statusFilter === 'approved' && !status.includes('Approved')) return false;
      if (statusFilter === 'released' && !status.includes('Released')) return false;
      if (statusFilter === 'fallback' && !status.includes('Fallback')) return false;
      if (statusFilter === 'converted' && !pkg.isConverted) return false;

      if (fromDate || toDate) {
        const activatedAt = pkg.activatedAt ? new Date(pkg.activatedAt) : null;
        if (fromDate && (!activatedAt || activatedAt < fromDate)) return false;
        if (toDate && (!activatedAt || activatedAt > toDate)) return false;
      }

      if (search) {
        const haystack = [
          pkg.id,
          pkg.status,
          pkg.empowermentType,
          pkg.User_EmpowermentPackage_sponsorIdToUser?.name,
          pkg.User_EmpowermentPackage_sponsorIdToUser?.email,
          pkg.User_EmpowermentPackage_beneficiaryIdToUser?.name,
          pkg.User_EmpowermentPackage_beneficiaryIdToUser?.email,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(search)) return false;
      }

      return true;
    });
  }, [empowermentPackages, statusFilter, packageSearch, dateFrom, dateTo]);

  const selectedPackages = useMemo(() => {
    if (selectedIds.size === 0) return [];
    return filteredPackages.filter((pkg) => selectedIds.has(pkg.id));
  }, [filteredPackages, selectedIds]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPackages.length) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(filteredPackages.map((pkg) => pkg.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleCsvExport = (scope: 'filtered' | 'selected' = 'filtered') => {
    const exportItems = scope === 'selected' ? selectedPackages : filteredPackages;
    if (exportItems.length === 0) {
      toast.error('No packages available for export.');
      return;
    }

    const headers = [
      'Package ID',
      'Status',
      'Sponsor Name',
      'Sponsor Email',
      'Beneficiary Name',
      'Beneficiary Email',
      'Empowerment Type',
      'Package Fee',
      'VAT',
      'Net Beneficiary Value',
      'Net Sponsor Reward',
      'Activated At',
      'Maturity Date',
      'Approved At',
      'Released At',
      'Converted',
      'Fallback Enabled',
    ];

    const rows = exportItems.map((pkg) => [
      pkg.id,
      pkg.status,
      pkg.User_EmpowermentPackage_sponsorIdToUser?.name || '',
      pkg.User_EmpowermentPackage_sponsorIdToUser?.email || '',
      pkg.User_EmpowermentPackage_beneficiaryIdToUser?.name || '',
      pkg.User_EmpowermentPackage_beneficiaryIdToUser?.email || '',
      pkg.empowermentType,
      pkg.packageFee,
      pkg.vat,
      pkg.netEmpowermentValue,
      pkg.netSponsorReward,
      formatDate(pkg.activatedAt),
      formatDate(pkg.maturityDate),
      formatDate(pkg.approvedAt),
      formatDate(pkg.releasedAt),
      pkg.isConverted ? 'Yes' : 'No',
      pkg.fallbackEnabled ? 'Yes' : 'No',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `empowerment-packages-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (isAdminView && activeTab === 'activate') {
      setActiveTab('history');
    }
  }, [isAdminView, activeTab]);

  const handleBulkAction = async (action: 'mature' | 'approve' | 'release' | 'fallback') => {
    if (selectedPackages.length === 0) return;

    const matured = (pkg: typeof selectedPackages[number]) =>
      pkg.maturityDate ? new Date(pkg.maturityDate).getTime() <= Date.now() : false;

    const eligible = selectedPackages.filter((pkg) => {
      const status = pkg.status || '';
      if (action === 'mature') return status.includes('Active') && matured(pkg);
      if (action === 'approve') return status.includes('Pending Maturity');
      if (action === 'release') return status.includes('Approved');
      if (action === 'fallback') return matured(pkg) && !pkg.fallbackEnabled && !status.includes('Released');
      return false;
    });

    if (eligible.length === 0) {
      toast.error('No eligible packages selected for this action.');
      return;
    }

    const avoidDuplicate = new Set<string>();
    try {
      if (action === 'mature') {
        for (const pkg of eligible) {
          if (avoidDuplicate.has(pkg.id)) continue;
          avoidDuplicate.add(pkg.id);
          await checkMaturity.mutateAsync({ empowermentId: pkg.id });
        }
        toast.success('Selected packages marked as mature.');
      }
      if (action === 'approve') {
        for (const pkg of eligible) {
          if (avoidDuplicate.has(pkg.id)) continue;
          avoidDuplicate.add(pkg.id);
          await approveEmpowerment.mutateAsync({ empowermentId: pkg.id });
        }
        toast.success('Selected packages approved.');
      }
      if (action === 'release') {
        for (const pkg of eligible) {
          if (avoidDuplicate.has(pkg.id)) continue;
          avoidDuplicate.add(pkg.id);
          await releaseFunds.mutateAsync({ empowermentId: pkg.id });
        }
        toast.success('Selected packages released.');
      }
      if (action === 'fallback') {
        for (const pkg of eligible) {
          if (avoidDuplicate.has(pkg.id)) continue;
          avoidDuplicate.add(pkg.id);
          await triggerFallback.mutateAsync({ empowermentId: pkg.id });
        }
        toast.success('Fallback protection activated for selected packages.');
      }

      clearSelection();
      utils.package.getMyEmpowermentPackages.invalidate();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bulk action failed';
      toast.error(message);
    }
  };

  const analytics = useMemo(() => {
    const totalPackages = empowermentPackages.length;
    const activePackages = empowermentPackages.filter((pkg) => pkg.status?.includes('Active')).length;
    const maturePackages = empowermentPackages.filter((pkg) => pkg.status?.includes('Maturity')).length;
    const approvedPackages = empowermentPackages.filter((pkg) => pkg.status?.includes('Approved')).length;
    const releasedPackages = empowermentPackages.filter((pkg) => pkg.status?.includes('Released')).length;
    const convertedPackages = empowermentPackages.filter((pkg) => pkg.isConverted).length;
    const totalInvested = empowermentPackages.reduce((sum, pkg) => sum + (pkg.packageFee + pkg.vat), 0);
    const projectedReturns = empowermentPackages.reduce(
      (sum, pkg) => sum + (pkg.netEmpowermentValue + pkg.netSponsorReward),
      0
    );

    return {
      totalPackages,
      activePackages,
      maturePackages,
      approvedPackages,
      releasedPackages,
      convertedPackages,
      totalInvested,
      projectedReturns,
    };
  }, [empowermentPackages]);

  const statusDistribution = useMemo(() => {
    const distribution = {
      Active: 0,
      Pending: 0,
      Mature: 0,
      Approved: 0,
      Released: 0,
      Fallback: 0,
      Converted: 0,
    };

    empowermentPackages.forEach((pkg) => {
      const status = pkg.status || '';
      if (status.includes('Active')) distribution.Active += 1;
      else if (status.includes('Pending')) distribution.Pending += 1;
      else if (status.includes('Maturity')) distribution.Mature += 1;
      else if (status.includes('Approved')) distribution.Approved += 1;
      else if (status.includes('Released')) distribution.Released += 1;
      else if (status.includes('Fallback')) distribution.Fallback += 1;
      if (pkg.isConverted) distribution.Converted += 1;
    });

    return distribution;
  }, [empowermentPackages]);

  const sparklinePoints = useMemo(() => {
    const buckets: { label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const label = date.toLocaleDateString('en-US', { month: 'short' });
      buckets.push({ label, count: 0 });
    }

    empowermentPackages.forEach((pkg) => {
      const activatedAt = pkg.activatedAt ? new Date(pkg.activatedAt) : null;
      if (!activatedAt) return;
      const label = activatedAt.toLocaleDateString('en-US', { month: 'short' });
      const bucket = buckets.find((b) => b.label === label);
      if (bucket) bucket.count += 1;
    });

    const max = Math.max(1, ...buckets.map((b) => b.count));
    const points = buckets.map((bucket, idx) => {
      const x = (idx / (buckets.length - 1)) * 100;
      const y = 100 - (bucket.count / max) * 100;
      return `${x},${y}`;
    });

    return { points: points.join(' '), buckets, max };
  }, [empowermentPackages]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-200">
            <FiBookOpen className="h-5 w-5" />
          </span>
          Empowerment Packages
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sponsor education and vocational training for BPI members (24-month maturity)
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        {[
          ...(!isAdminView ? [{ id: 'activate' as const, label: 'Activate Package', icon: FiBookOpen }] : []),
          { id: 'history' as const, label: 'My Packages', icon: FiClock },
          { id: 'analytics' as const, label: 'Analytics', icon: FiBarChart2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!isAdminView && activeTab === 'activate' && (
              <motion.div
                key="activate"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Package Info Card */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg p-6 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                        Package Investment
                      </h3>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        24-month maturity period
                      </p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-200">
                      <FiAward className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mb-4">
                    {formatAmount(PACKAGE_COST)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-emerald-700 dark:text-emerald-300">Package Fee:</span>
                      <p className="font-semibold text-emerald-900 dark:text-emerald-100">{formatAmount(330000)}</p>
                    </div>
                    <div>
                      <span className="text-emerald-700 dark:text-emerald-300">VAT (7.5%):</span>
                      <p className="font-semibold text-emerald-900 dark:text-emerald-100">{formatAmount(24750)}</p>
                    </div>
                  </div>
                </div>

                {/* Beneficiary Selection */}
                <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-200">
                      <FiUsers className="h-4 w-4" />
                    </span>
                    Select Beneficiary
                  </h3>

                  {!selectedBeneficiary ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by name or email (min 2 characters)..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white placeholder:text-gray-500"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <FiX className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>

                      {isSearching && (
                        <div className="text-center py-8">
                          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Searching...</p>
                        </div>
                      )}

                      {searchResults && searchResults.length > 0 && (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {searchResults.map((user) => (
                            <motion.button
                              key={user.id}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => setSelectedBeneficiary({
                                id: user.id,
                                name: user.name,
                                email: user.email,
                              })}
                              className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors text-left"
                            >
                              <div className="w-10 h-10 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-200 flex items-center justify-center flex-shrink-0">
                                <FiUsers className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                  {user.name || user.screenName || 'Unknown User'}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                              </div>
                              <FiArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            </motion.button>
                          ))}
                        </div>
                      )}

                      {searchQuery.length >= 2 && !isSearching && searchResults && searchResults.length === 0 && (
                        <div className="text-center py-8">
                          <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 dark:text-gray-400">No members found</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <div className="w-12 h-12 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-200 flex items-center justify-center flex-shrink-0">
                        <FiCheck className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                          {selectedBeneficiary.name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">{selectedBeneficiary.email}</p>
                      </div>
                      <button
                        onClick={() => setSelectedBeneficiary(null)}
                        className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-lg transition-colors"
                      >
                        <FiX className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Empowerment Type */}
                <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-200">
                      <FiTarget className="h-4 w-4" />
                    </span>
                    Empowerment Type
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { value: 'CHILD_EDUCATION' as const, label: 'Child Education', icon: FiBookOpen, desc: 'Primary & secondary education support' },
                      { value: 'VOCATIONAL_SKILL' as const, label: 'Vocational Training', icon: FiBriefcase, desc: 'Professional skill development' },
                    ].map((type) => (
                      <motion.button
                        key={type.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setEmpowermentType(type.value)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          empowermentType === type.value
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            empowermentType === type.value
                              ? 'bg-emerald-100 dark:bg-emerald-900'
                              : 'bg-gray-100 dark:bg-gray-700'
                          }`}>
                            <type.icon className={`w-5 h-5 ${
                              empowermentType === type.value ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <p className={`font-semibold mb-1 ${
                              empowermentType === type.value ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-white'
                            }`}>
                              {type.label}
                            </p>
                            <p className={`text-sm ${
                              empowermentType === type.value ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {type.desc}
                            </p>
                          </div>
                          {empowermentType === type.value && (
                            <FiCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Payment Gateway */}
                <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-200">
                      <FiCreditCard className="h-4 w-4" />
                    </span>
                    Payment Method
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentGateway('wallet')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        paymentGateway === 'wallet'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                      }`}
                    >
                      <FiDollarSign className={`w-6 h-6 mx-auto mb-2 ${
                        paymentGateway === 'wallet' ? 'text-emerald-600' : 'text-gray-600'
                      }`} />
                      <p className={`text-sm font-semibold ${
                        paymentGateway === 'wallet' ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-white'
                      }`}>
                        BPI Wallet
                      </p>
                    </motion.button>

                    {availableGateways && availableGateways.some((g) => g.gatewayName === 'paystack' && g.isActive) && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPaymentGateway('paystack')}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          paymentGateway === 'paystack'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                        }`}
                      >
                        <FiCreditCard className={`w-6 h-6 mx-auto mb-2 ${
                          paymentGateway === 'paystack' ? 'text-emerald-600' : 'text-gray-600'
                        }`} />
                        <p className={`text-sm font-semibold ${
                          paymentGateway === 'paystack' ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-white'
                        }`}>
                          Paystack
                        </p>
                      </motion.button>
                    )}

                    {availableGateways && availableGateways.some((g) => g.gatewayName === 'flutterwave' && g.isActive) && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPaymentGateway('flutterwave')}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          paymentGateway === 'flutterwave'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                        }`}
                      >
                        <FiCreditCard className={`w-6 h-6 mx-auto mb-2 ${
                          paymentGateway === 'flutterwave' ? 'text-emerald-600' : 'text-gray-600'
                        }`} />
                        <p className={`text-sm font-semibold ${
                          paymentGateway === 'flutterwave' ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-white'
                        }`}>
                          Flutterwave
                        </p>
                      </motion.button>
                    )}

                    {availableGateways && availableGateways.some((g) => g.gatewayName === 'bank-transfer' && g.isActive) && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPaymentGateway('bank-transfer')}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          paymentGateway === 'bank-transfer'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                        }`}
                      >
                        <FiSend className={`w-6 h-6 mx-auto mb-2 ${
                          paymentGateway === 'bank-transfer' ? 'text-emerald-600' : 'text-gray-600'
                        }`} />
                        <p className={`text-sm font-semibold ${
                          paymentGateway === 'bank-transfer' ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-white'
                        }`}>
                          Bank Transfer
                        </p>
                        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                          Admin verification required
                        </p>
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Activate Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleActivate}
                  disabled={!selectedBeneficiary || activateEmpowerment.status === 'pending'}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {activateEmpowerment.status === 'pending' ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-3 border-solid border-white border-r-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiBookOpen className="w-5 h-5" />
                      Activate Empowerment Package
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Package History</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Track your sponsored and beneficiary packages</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          value={packageSearch}
                          onChange={(e) => setPackageSearch(e.target.value)}
                          placeholder="Search sponsor, beneficiary, status..."
                          className="w-64 rounded-full border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none dark:border-gray-700 dark:bg-bpi-dark-card dark:text-gray-200"
                        />
                      </div>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none dark:border-gray-700 dark:bg-bpi-dark-card dark:text-gray-200"
                      />
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none dark:border-gray-700 dark:bg-bpi-dark-card dark:text-gray-200"
                      />
                      {(packageSearch || dateFrom || dateTo) && (
                        <button
                          onClick={() => {
                            setPackageSearch('');
                            setDateFrom('');
                            setDateTo('');
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 dark:border-gray-700 dark:text-gray-300"
                        >
                          <FiX className="h-3.5 w-3.5" />
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'active', label: 'Active' },
                        { id: 'pending', label: 'Pending' },
                        { id: 'mature', label: 'Mature' },
                        { id: 'approved', label: 'Approved' },
                        { id: 'released', label: 'Released' },
                        { id: 'fallback', label: 'Fallback' },
                        { id: 'converted', label: 'Converted' },
                      ].map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setStatusFilter(filter.id as StatusFilter)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            statusFilter === filter.id
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {me?.role && (me.role === 'admin' || me.role === 'super_admin') && filteredPackages.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600 shadow-sm dark:border-gray-700 dark:bg-bpi-dark-card dark:text-gray-300">
                      <button
                        onClick={toggleSelectAll}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200"
                      >
                        {selectedIds.size === filteredPackages.length ? (
                          <FiCheckSquare className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <FiSquare className="h-4 w-4 text-gray-400" />
                        )}
                        Select all ({selectedIds.size}/{filteredPackages.length})
                      </button>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleCsvExport(selectedIds.size > 0 ? 'selected' : 'filtered')}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-gray-300 dark:border-gray-700 dark:text-gray-300"
                        >
                          <FiDownload className="h-3.5 w-3.5" />
                          Export CSV
                        </button>
                        <button
                          onClick={() => handleBulkAction('mature')}
                          disabled={selectedIds.size === 0 || checkMaturity.status === 'pending'}
                          className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:border-amber-300 disabled:opacity-60 dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-200"
                        >
                          <FiRefreshCcw className="h-3.5 w-3.5" />
                          Mark Mature
                        </button>
                        <button
                          onClick={() => handleBulkAction('approve')}
                          disabled={selectedIds.size === 0 || approveEmpowerment.status === 'pending'}
                          className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:border-blue-300 disabled:opacity-60 dark:border-blue-700/50 dark:bg-blue-900/30 dark:text-blue-200"
                        >
                          <FiCheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleBulkAction('release')}
                          disabled={selectedIds.size === 0 || releaseFunds.status === 'pending'}
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 disabled:opacity-60 dark:border-emerald-700/50 dark:bg-emerald-900/30 dark:text-emerald-200"
                        >
                          <FiSend className="h-3.5 w-3.5" />
                          Release
                        </button>
                        <button
                          onClick={() => handleBulkAction('fallback')}
                          disabled={selectedIds.size === 0 || triggerFallback.status === 'pending'}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 disabled:opacity-60 dark:border-rose-700/50 dark:bg-rose-900/30 dark:text-rose-200"
                        >
                          <FiShield className="h-3.5 w-3.5" />
                          Fallback
                        </button>
                        {selectedIds.size > 0 && (
                          <button
                            onClick={clearSelection}
                            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-gray-300 dark:border-gray-700 dark:text-gray-300"
                          >
                            <FiX className="h-3.5 w-3.5" />
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {isLoadingPackages ? (
                  <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ) : filteredPackages.length === 0 ? (
                  <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="text-center py-12">
                      <FiClock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No packages found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Try a different filter or activate a package
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPackages.map((pkg) => {
                      const progress = getProgress(pkg.activatedAt, pkg.maturityDate);
                      const isSponsor = pkg.sponsorId === (me?.id || '');
                      const isAdmin = me?.role === 'admin' || me?.role === 'super_admin';
                      const roleLabel = me ? (isSponsor ? 'Sponsor' : 'Beneficiary') : 'Member';
                      const isMatured = pkg.maturityDate ? new Date(pkg.maturityDate).getTime() <= Date.now() : false;
                      const statusLabel = pkg.status || '';
                      return (
                        <div
                          key={pkg.id}
                          className="bg-white dark:bg-bpi-dark-card rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {(me?.role === 'admin' || me?.role === 'super_admin') && (
                                  <button
                                    onClick={() => toggleSelection(pkg.id)}
                                    className="inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-500 hover:border-emerald-300 hover:text-emerald-600 dark:border-gray-700 dark:text-gray-400"
                                  >
                                    {selectedIds.has(pkg.id) ? (
                                      <FiCheckSquare className="h-4 w-4 text-emerald-600" />
                                    ) : (
                                      <FiSquare className="h-4 w-4" />
                                    )}
                                  </button>
                                )}
                                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-200">
                                  <FiBookOpen className="h-3.5 w-3.5" />
                                  {roleLabel}
                                </span>
                                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getStatusTone(pkg.status || '')}`}>
                                  {pkg.status}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Activated {formatDate(pkg.activatedAt)}
                              </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Sponsor</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {pkg.User_EmpowermentPackage_sponsorIdToUser?.name || 'Unknown'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {pkg.User_EmpowermentPackage_sponsorIdToUser?.email || '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Beneficiary</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {pkg.User_EmpowermentPackage_beneficiaryIdToUser?.name || 'Unknown'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {pkg.User_EmpowermentPackage_beneficiaryIdToUser?.email || '—'}
                                </p>
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>Maturity progress</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <div className="mt-2 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>Matures {formatDate(pkg.maturityDate)}</span>
                                <span>{pkg.empowermentType.replace('_', ' ')}</span>
                              </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                              <div className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Total Cost</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {formatAmount(pkg.packageFee + pkg.vat)}
                                </p>
                              </div>
                              <div className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Beneficiary Value</p>
                                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  {formatAmount(pkg.netEmpowermentValue)}
                                </p>
                              </div>
                              <div className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Sponsor Reward</p>
                                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  {formatAmount(pkg.netSponsorReward)}
                                </p>
                              </div>
                            </div>

                            {isSponsor && !pkg.isConverted && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                <button
                                  onClick={() => convertToRegularPlus.mutate({ empowermentId: pkg.id })}
                                  disabled={convertToRegularPlus.status === 'pending'}
                                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 disabled:opacity-60 dark:border-emerald-700/50 dark:bg-emerald-900/30 dark:text-emerald-200"
                                >
                                  <FiTrendingUp className="h-3.5 w-3.5" />
                                  Convert to Regular Plus
                                </button>
                              </div>
                            )}

                            {isAdmin && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {statusLabel.includes('Active') && isMatured && (
                                  <button
                                    onClick={() => checkMaturity.mutate({ empowermentId: pkg.id })}
                                    disabled={checkMaturity.status === 'pending'}
                                    className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:border-amber-300 disabled:opacity-60 dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-200"
                                  >
                                    <FiRefreshCcw className="h-3.5 w-3.5" />
                                    Mark Mature
                                  </button>
                                )}
                                {statusLabel.includes('Pending Maturity') && (
                                  <button
                                    onClick={() => approveEmpowerment.mutate({ empowermentId: pkg.id })}
                                    disabled={approveEmpowerment.status === 'pending'}
                                    className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:border-blue-300 disabled:opacity-60 dark:border-blue-700/50 dark:bg-blue-900/30 dark:text-blue-200"
                                  >
                                    <FiCheckCircle className="h-3.5 w-3.5" />
                                    Approve
                                  </button>
                                )}
                                {statusLabel.includes('Approved') && (
                                  <button
                                    onClick={() => releaseFunds.mutate({ empowermentId: pkg.id })}
                                    disabled={releaseFunds.status === 'pending'}
                                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 disabled:opacity-60 dark:border-emerald-700/50 dark:bg-emerald-900/30 dark:text-emerald-200"
                                  >
                                    <FiSend className="h-3.5 w-3.5" />
                                    Release Funds
                                  </button>
                                )}
                                {isMatured && !pkg.fallbackEnabled && !statusLabel.includes('Released') && (
                                  <button
                                    onClick={() => triggerFallback.mutate({ empowermentId: pkg.id })}
                                    disabled={triggerFallback.status === 'pending'}
                                    className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 disabled:opacity-60 dark:border-rose-700/50 dark:bg-rose-900/30 dark:text-rose-200"
                                  >
                                    <FiShield className="h-3.5 w-3.5" />
                                    Trigger Fallback
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {me?.role && (me.role === 'admin' || me.role === 'super_admin') && (
                  <div className="pt-6">
                    <AdminActivityTracker />
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: 'Total Packages', value: analytics.totalPackages, icon: FiBookOpen },
                    { label: 'Active Packages', value: analytics.activePackages, icon: FiTrendingUp },
                    { label: 'Pending Maturity', value: analytics.maturePackages, icon: FiClock },
                    { label: 'Released Packages', value: analytics.releasedPackages, icon: FiCheck },
                    { label: 'Converted Packages', value: analytics.convertedPackages, icon: FiTrendingUp },
                  ].map((card) => (
                    <div key={card.label} className="bg-white dark:bg-bpi-dark-card rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{card.value}</p>
                        </div>
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-200">
                          <card.icon className="h-5 w-5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activation Trend</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Last 6 months</p>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-200">
                        <FiTrendingUp className="h-5 w-5" />
                      </span>
                    </div>
                    <div className="h-32 w-full">
                      <svg viewBox="0 0 100 100" className="h-full w-full">
                        <polyline
                          fill="none"
                          stroke="rgb(16 185 129)"
                          strokeWidth="3"
                          points={sparklinePoints.points}
                        />
                        <polyline
                          fill="rgba(16, 185, 129, 0.15)"
                          stroke="none"
                          points={`0,100 ${sparklinePoints.points} 100,100`}
                        />
                      </svg>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      {sparklinePoints.buckets.map((bucket) => (
                        <span key={bucket.label}>{bucket.label}</span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Status Distribution</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Current package states</p>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-200">
                        <FiPieChart className="h-5 w-5" />
                      </span>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(statusDistribution).map(([label, value]) => (
                        <div key={label}>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{label}</span>
                            <span>{value}</span>
                          </div>
                          <div className="mt-1 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                              style={{ width: `${Math.min(100, (value / Math.max(1, analytics.totalPackages)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Capital Overview</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Projected value at maturity</p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-200">
                      <FiBarChart2 className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total Invested</p>
                      <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatAmount(analytics.totalInvested)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Projected Returns</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {formatAmount(analytics.projectedReturns)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar - Quick Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Stats Overview */}
          <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-200">
                <FiPieChart className="h-3.5 w-3.5" />
              </span>
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Active Packages</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activePackages}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Invested</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatAmount(analytics.totalInvested)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Maturing Soon</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.maturePackages}</p>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg p-6 border border-emerald-200 dark:border-emerald-800">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-200 mb-3">
              <FiCalendar className="h-5 w-5" />
            </span>
            <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
              24-Month Maturity
            </h4>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4">
              Empowerment packages mature after 24 months and require admin approval before fund release.
            </p>
            <div className="space-y-2 text-xs text-emerald-700 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <FiCheck className="w-4 h-4 flex-shrink-0" />
                <span>Sponsor: 30% return on maturity</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheck className="w-4 h-4 flex-shrink-0" />
                <span>Beneficiary: Education wallet credit</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheck className="w-4 h-4 flex-shrink-0" />
                <span>Admin approval required</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
