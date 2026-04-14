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
  FiSettings,
  FiEye,
  FiEyeOff,
  FiGift,
  FiSliders,
  FiAlertTriangle,
  FiLayers,
  FiUserPlus,
  FiUser,
  FiMail,
  FiLock,
  FiTag,
} from 'react-icons/fi';
import { api } from '@/client/trpc';
import toast from 'react-hot-toast';

const PACKAGE_COST = 354750; // ₦330,000 + ₦24,750 VAT

type TabView = 'activate' | 'history' | 'analytics' | 'config';
type StatusFilter = 'all' | 'active' | 'pending' | 'mature' | 'approved' | 'released' | 'fallback' | 'converted';
type EmpowermentType = 'CHILD_EDUCATION' | 'VOCATIONAL_SKILL';
type Gateway = 'wallet' | 'paystack' | 'flutterwave' | 'bank-transfer' | 'crypto';
type OutcomeType =
  | 'FULL_APPROVAL'
  | 'PARTIAL_DECLINE_50'
  | 'PARTIAL_DECLINE_75'
  | 'PARTIAL_DECLINE_OTHER'
  | 'FULL_DECLINE';

interface SelectedBeneficiary {
  id: string;
  name: string | null;
  email: string | null;
}

/** Renders per-package tranche history — lives outside main component so hooks are valid inside .map() */
function PkgTranchesRow({
  empowermentId,
  formatAmt,
  formatDt,
}: {
  empowermentId: string;
  formatAmt: (v: number) => string;
  formatDt: (v: any) => string;
}) {
  const { data, isLoading } = api.package.getEmpowermentTranches.useQuery({ empowermentId });
  if (isLoading)
    return <div className="animate-pulse h-8 rounded bg-gray-100 dark:bg-gray-800" />;
  if (!data?.length)
    return <p className="text-xs text-gray-400 dark:text-gray-500">No tranches released yet.</p>;
  return (
    <div className="space-y-2">
      {(data as any[]).map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 px-3 py-2 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold text-[10px]">
              {t.trancheNumber}
            </span>
            <span className="text-gray-700 dark:text-gray-300">{t.percent}%</span>
            <span className="text-gray-400 dark:text-gray-500">· {formatDt(t.releasedAt)}</span>
            {t.trancheNumber === 1 && (
              <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Sponsor rewarded
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatAmt(t.netAmount)}</p>
            <p className="text-gray-400 dark:text-gray-500">net credited</p>
          </div>
        </div>
      ))}
    </div>
  );
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
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [waiverFilter, setWaiverFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Sprint 3 — outcome management & config
  const [selectedPkg, setSelectedPkg] = useState<any | null>(null);
  const [outcomeType, setOutcomeType] = useState<OutcomeType | ''>('');
  const [customCreditPct, setCustomCreditPct] = useState<number>(50);
  const [tranchePct, setTranchePct] = useState<number>(20);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [expandedTranchePkgs, setExpandedTranchePkgs] = useState<Set<string>>(new Set());
  // CSP waiver transfer form state
  const [cspTransferPkgId, setCspTransferPkgId] = useState<string | null>(null);
  const [cspTransferAmount, setCspTransferAmount] = useState<string>('');
  const [cspTransferPin, setCspTransferPin] = useState<string>('');
  const [cspTransferTarget, setCspTransferTarget] = useState<'community' | 'wallet'>('community');

  // Create-beneficiary form state
  const [showCreateBeneficiary, setShowCreateBeneficiary] = useState(false);
  const [benCreateForm, setBenCreateForm] = useState({
    firstname: '',
    lastname: '',
    screenname: '',
    gender: '' as 'male' | 'female' | '',
    email: '',
    password: '',
    confirmPassword: '',
    captcha: '',
  });
  const [benCreateErr, setBenCreateErr] = useState<string | null>(null);
  const [benCaptchaNums, setBenCaptchaNums] = useState<[number, number]>([
    Math.floor(Math.random() * 10) + 1,
    Math.floor(Math.random() * 10) + 1,
  ]);
  const [benShowPass, setBenShowPass] = useState(false);
  const [benShowConfPass, setBenShowConfPass] = useState(false);

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

  // Sprint 3 — new admin mutations / queries
  const setOutcomeMut = api.package.setEmpowermentOutcome.useMutation({
    onSuccess: () => {
      toast.success('Outcome set successfully.');
      utils.package.getMyEmpowermentPackages.invalidate();
      setSelectedPkg(null);
      setOutcomeType('');
    },
    onError: (e) => toast.error(e.message || 'Failed to set outcome'),
  });

  const releaseTrancheMut = api.package.releaseEmpowermentTranche.useMutation({
    onSuccess: () => {
      toast.success('Tranche released successfully.');
      utils.package.getMyEmpowermentPackages.invalidate();
      setTranchePct(20);
    },
    onError: (e) => toast.error(e.message || 'Tranche release failed'),
  });

  const trancheQuery = api.package.getEmpowermentTranches.useQuery(
    { empowermentId: selectedPkg?.id ?? '' },
    { enabled: !!(selectedPkg?.id) },
  );

  const empConfigQuery = api.package.getEmpowermentConfig.useQuery(undefined, { enabled: isAdminView });

  const updateConfigMut = api.package.updateEmpowermentConfig.useMutation({
    onSuccess: () => {
      toast.success('Configuration saved.');
      void empConfigQuery.refetch();
    },
    onError: (e) => toast.error(e.message || 'Failed to save config'),
  });

  const cspTransferMut = api.wallet.transferInterWallet.useMutation({
    onSuccess: () => {
      toast.success('CSP contribution transfer successful! Your CSP waiver has been applied.');
      setCspTransferPkgId(null);
      setCspTransferAmount('');
      setCspTransferPin('');
      utils.package.getMyEmpowermentPackages.invalidate();
    },
    onError: (e) => toast.error(e.message || 'Transfer failed'),
  });

  const createBeneficiaryMut = api.user.createBeneficiary.useMutation({
    onSuccess: (data) => {
      setSelectedBeneficiary({ id: data.id, name: data.name ?? null, email: data.email ?? null });
      setShowCreateBeneficiary(false);
      setBenCreateForm({ firstname: '', lastname: '', screenname: '', gender: '', email: '', password: '', confirmPassword: '', captcha: '' });
      setBenCreateErr(null);
      toast.success('🎉 Beneficiary created and selected! Proceed to activate the package.');
    },
    onError: (e) => {
      setBenCreateErr(e.message || 'Failed to create beneficiary');
      // Refresh captcha on error
      setBenCaptchaNums([Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 10) + 1]);
    },
  });

  const handleCreateBeneficiary = () => {
    setBenCreateErr(null);
    if (parseInt(benCreateForm.captcha, 10) !== benCaptchaNums[0] + benCaptchaNums[1]) {
      setBenCreateErr('Incorrect captcha answer. Please try again.');
      setBenCreateForm((p) => ({ ...p, captcha: '' }));
      setBenCaptchaNums([Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 10) + 1]);
      return;
    }
    if (!benCreateForm.gender) { setBenCreateErr('Please select a gender.'); return; }
    if (benCreateForm.password !== benCreateForm.confirmPassword) { setBenCreateErr('Passwords do not match.'); return; }
    createBeneficiaryMut.mutate({
      firstname: benCreateForm.firstname,
      lastname: benCreateForm.lastname,
      screenname: benCreateForm.screenname,
      gender: benCreateForm.gender as 'male' | 'female',
      email: benCreateForm.email,
      password: benCreateForm.password,
      confirmPassword: benCreateForm.confirmPassword,
    });
  };

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

    if (paymentGateway === 'crypto') {
      const params = new URLSearchParams({
        amount: String(PACKAGE_COST),
        purpose: 'empowerment',
        beneficiaryId: selectedBeneficiary.id,
        empowermentType,
        packageId: 'empowerment',
      });
      window.location.href = `/membership/payment/crypto?${params.toString()}`;
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

      // Outcome type filter
      if (outcomeFilter !== 'all') {
        if (outcomeFilter === 'none') {
          if ((pkg as any).outcomeType) return false;
        } else {
          if ((pkg as any).outcomeType !== outcomeFilter) return false;
        }
      }

      // CSP waiver filter
      if (waiverFilter === 'active') {
        if (!(pkg as any).cspWaiverEnabled || (pkg as any).cspWaiverUsed) return false;
      } else if (waiverFilter === 'used') {
        if (!(pkg as any).cspWaiverUsed) return false;
      }

      return true;
    });
  }, [empowermentPackages, statusFilter, packageSearch, dateFrom, dateTo, outcomeFilter, waiverFilter]);

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

  // Sync config form with fetched values
  useEffect(() => {
    if (empConfigQuery.data) {
      setConfigValues(empConfigQuery.data as Record<string, string>);
    }
  }, [empConfigQuery.data]);

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
    // Sprint 4 — outcome-aware metrics
    const totalCredited = empowermentPackages.reduce((sum, pkg) => sum + ((pkg as any).totalReleasedAmount ?? 0), 0);
    const totalSponsorRewardsPaid = empowermentPackages.reduce((sum, pkg) => sum + ((pkg as any).sponsorRewardAmount ?? 0), 0);
    const cspWaiverActive = empowermentPackages.filter((pkg) => (pkg as any).cspWaiverEnabled && !(pkg as any).cspWaiverUsed).length;
    const cspWaiverUsed = empowermentPackages.filter((pkg) => (pkg as any).cspWaiverUsed).length;
    const fullApprovalPackages = empowermentPackages.filter((pkg) => (pkg as any).outcomeType === 'FULL_APPROVAL').length;
    const declinePackages = empowermentPackages.filter((pkg) => (pkg as any).outcomeType && (pkg as any).outcomeType !== 'FULL_APPROVAL').length;

    return {
      totalPackages,
      activePackages,
      maturePackages,
      approvedPackages,
      releasedPackages,
      convertedPackages,
      totalInvested,
      projectedReturns,
      totalCredited,
      totalSponsorRewardsPaid,
      cspWaiverActive,
      cspWaiverUsed,
      fullApprovalPackages,
      declinePackages,
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
          { id: 'history' as const, label: isAdminView ? 'All Packages' : 'My Packages', icon: FiClock },
          { id: 'analytics' as const, label: 'Analytics', icon: FiBarChart2 },
          ...(isAdminView ? [{ id: 'config' as const, label: 'Configuration', icon: FiSettings }] : []),
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

                      {/* Divider */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">or add someone new</span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                      </div>

                      {/* Create-New-Beneficiary Toggle */}
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          setShowCreateBeneficiary(!showCreateBeneficiary);
                          setBenCreateErr(null);
                          if (!showCreateBeneficiary) {
                            setBenCaptchaNums([Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 10) + 1]);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors text-sm font-medium"
                      >
                        <FiUserPlus className="w-4 h-4" />
                        {showCreateBeneficiary ? 'Cancel — go back to search' : 'Create New Beneficiary'}
                      </motion.button>

                      {/* Inline Create-Beneficiary Form */}
                      <AnimatePresence>
                        {showCreateBeneficiary && (
                          <motion.div
                            key="create-beneficiary-form"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="pt-2 space-y-3 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 bg-emerald-50/40 dark:bg-emerald-950/20">
                              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed">
                                Register a new member directly as your referral &amp; beneficiary. They will be anchored under your account.
                              </p>

                              {/* First + Last Name */}
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full border border-gray-400 text-gray-500 pointer-events-none">
                                    <FiUser className="w-3 h-3" />
                                  </span>
                                  <input
                                    type="text"
                                    placeholder="First Name"
                                    value={benCreateForm.firstname}
                                    onChange={(e) => setBenCreateForm((p) => ({ ...p, firstname: e.target.value }))}
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                                <div className="relative flex-1">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full border border-gray-400 text-gray-500 pointer-events-none">
                                    <FiUser className="w-3 h-3" />
                                  </span>
                                  <input
                                    type="text"
                                    placeholder="Last Name"
                                    value={benCreateForm.lastname}
                                    onChange={(e) => setBenCreateForm((p) => ({ ...p, lastname: e.target.value }))}
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                              </div>

                              {/* Screen Name */}
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full border border-gray-400 text-gray-500 pointer-events-none">
                                  <FiTag className="w-3 h-3" />
                                </span>
                                <input
                                  type="text"
                                  placeholder="Username"
                                  value={benCreateForm.screenname}
                                  onChange={(e) => setBenCreateForm((p) => ({ ...p, screenname: e.target.value }))}
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>

                              {/* Gender */}
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full border border-gray-400 text-gray-500 pointer-events-none">
                                  <FiSliders className="w-3 h-3" />
                                </span>
                                <select
                                  value={benCreateForm.gender}
                                  onChange={(e) => setBenCreateForm((p) => ({ ...p, gender: e.target.value as 'male' | 'female' | '' }))}
                                  className="block w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none"
                                >
                                  <option value="" disabled>Select Gender</option>
                                  <option value="male">Male</option>
                                  <option value="female">Female</option>
                                </select>
                              </div>

                              {/* Email */}
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full border border-gray-400 text-gray-500 pointer-events-none">
                                  <FiMail className="w-3 h-3" />
                                </span>
                                <input
                                  type="email"
                                  placeholder="Email Address"
                                  value={benCreateForm.email}
                                  onChange={(e) => setBenCreateForm((p) => ({ ...p, email: e.target.value }))}
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>

                              {/* Password */}
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full border border-gray-400 text-gray-500 pointer-events-none">
                                  <FiLock className="w-3 h-3" />
                                </span>
                                <input
                                  type={benShowPass ? 'text' : 'password'}
                                  placeholder="Password (min 8 chars)"
                                  value={benCreateForm.password}
                                  onChange={(e) => setBenCreateForm((p) => ({ ...p, password: e.target.value }))}
                                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => setBenShowPass(!benShowPass)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                                >
                                  {benShowPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                </button>
                              </div>

                              {/* Confirm Password */}
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full border border-gray-400 text-gray-500 pointer-events-none">
                                  <FiLock className="w-3 h-3" />
                                </span>
                                <input
                                  type={benShowConfPass ? 'text' : 'password'}
                                  placeholder="Confirm Password"
                                  value={benCreateForm.confirmPassword}
                                  onChange={(e) => setBenCreateForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => setBenShowConfPass(!benShowConfPass)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                                >
                                  {benShowConfPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                </button>
                              </div>

                              {/* Math Captcha */}
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full border border-gray-400 text-gray-500 pointer-events-none">
                                  <FiRefreshCcw className="w-3 h-3" />
                                </span>
                                <input
                                  type="number"
                                  placeholder={`What is ${benCaptchaNums[0]} + ${benCaptchaNums[1]}?`}
                                  value={benCreateForm.captcha}
                                  onChange={(e) => setBenCreateForm((p) => ({ ...p, captcha: e.target.value }))}
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>

                              {/* Error */}
                              {benCreateErr && (
                                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                  <FiAlertCircle className="w-3 h-3 flex-shrink-0" />
                                  {benCreateErr}
                                </p>
                              )}

                              {/* Submit */}
                              <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={handleCreateBeneficiary}
                                disabled={createBeneficiaryMut.status === 'pending'}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                              >
                                <FiUserPlus className="w-4 h-4" />
                                {createBeneficiaryMut.status === 'pending' ? 'Creating account…' : 'Create & Select as Beneficiary'}
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
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

                    {availableGateways && availableGateways.some((g) => g.gatewayName === 'crypto' && g.isActive) && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPaymentGateway('crypto')}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          paymentGateway === 'crypto'
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                        }`}
                      >
                        <FiDollarSign className={`w-6 h-6 mx-auto mb-2 ${
                          paymentGateway === 'crypto' ? 'text-orange-600' : 'text-gray-600'
                        }`} />
                        <p className={`text-sm font-semibold ${
                          paymentGateway === 'crypto' ? 'text-orange-900 dark:text-orange-100' : 'text-gray-900 dark:text-white'
                        }`}>
                          Crypto (USDT)
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
                    {/* Outcome type + CSP waiver advanced filters (admin only) */}
                    {isAdminView && (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={outcomeFilter}
                          onChange={(e) => setOutcomeFilter(e.target.value)}
                          className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none dark:border-gray-700 dark:bg-bpi-dark-card dark:text-gray-200"
                        >
                          <option value="all">All Outcomes</option>
                          <option value="none">No Outcome Set</option>
                          <option value="FULL_APPROVAL">Full Approval</option>
                          <option value="PARTIAL_DECLINE_50">Partial Decline 50%</option>
                          <option value="PARTIAL_DECLINE_75">Partial Decline 75%</option>
                          <option value="PARTIAL_DECLINE_OTHER">Partial Decline Custom</option>
                          <option value="FULL_DECLINE">Full Decline</option>
                        </select>
                        <select
                          value={waiverFilter}
                          onChange={(e) => setWaiverFilter(e.target.value)}
                          className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none dark:border-gray-700 dark:bg-bpi-dark-card dark:text-gray-200"
                        >
                          <option value="all">All Waiver Status</option>
                          <option value="active">Waiver Active</option>
                          <option value="used">Waiver Used</option>
                        </select>
                        {(outcomeFilter !== 'all' || waiverFilter !== 'all') && (
                          <button
                            onClick={() => { setOutcomeFilter('all'); setWaiverFilter('all'); }}
                            className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300"
                          >
                            <FiX className="h-3 w-3" /> Clear Filters
                          </button>
                        )}
                      </div>
                    )}
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

                            {/* Education wallet balance — beneficiary only */}
                            {!isAdmin && !isSponsor && (
                              <div className="rounded-lg border border-blue-100 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 bg-white dark:border-blue-700 dark:bg-blue-950">
                                    <FiBookOpen className="h-3.5 w-3.5" />
                                  </span>
                                  Education Wallet Balance
                                </div>
                                <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                  {formatAmount((me as any)?.education ?? 0)}
                                </p>
                              </div>
                            )}

                            {/* Outcome Badge — visible to all users */}
                            {(pkg as any).outcomeType && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                                  (pkg as any).outcomeType === 'FULL_APPROVAL'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                                    : (pkg as any).outcomeType === 'FULL_DECLINE'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800'
                                }`}>
                                  <FiLayers className="h-3 w-3" />
                                  {(pkg as any).outcomeType.replace(/_/g, ' ')}
                                  {(pkg as any).outcomeType === 'FULL_APPROVAL' && (pkg as any).totalReleasedPercent > 0 && (
                                    <span className="ml-1 opacity-75">· {Math.round((pkg as any).totalReleasedPercent)}% released</span>
                                  )}
                                </span>
                                {(pkg as any).cspWaiverEnabled && (
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                                    (pkg as any).cspWaiverUsed
                                      ? 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700'
                                      : 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800'
                                  }`}>
                                    <FiShield className="h-3 w-3" />
                                    CSP Waiver {(pkg as any).cspWaiverUsed ? 'Used' : 'Available'}
                                  </span>
                                )}
                                {(pkg as any).sponsorRewardPaid && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800">
                                    <FiGift className="h-3 w-3" />
                                    Sponsor Reward Credited · {formatAmount((pkg as any).sponsorRewardAmount ?? 0)}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* User-facing Full Approval progress + Tranche history */}
                            {!isAdmin && (pkg as any).outcomeType === 'FULL_APPROVAL' && (
                              <div className="space-y-3">
                                <div className="rounded-lg border border-emerald-100 dark:border-emerald-900 p-3 space-y-2">
                                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>Education wallet credited</span>
                                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                      {Math.round((pkg as any).totalReleasedPercent ?? 0)}% · {formatAmount((pkg as any).totalReleasedAmount ?? 0)}
                                    </span>
                                  </div>
                                  <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                                    <div
                                      className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                                      style={{ width: `${(pkg as any).totalReleasedPercent ?? 0}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                                    <span>Remaining: {100 - Math.round((pkg as any).totalReleasedPercent ?? 0)}% unreleased</span>
                                    {((pkg as any).totalReleasedPercent ?? 0) >= 100 && (
                                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Fully released</span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => setExpandedTranchePkgs((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(pkg.id)) next.delete(pkg.id); else next.add(pkg.id);
                                    return next;
                                  })}
                                  className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline"
                                >
                                  <FiLayers className="h-3.5 w-3.5" />
                                  {expandedTranchePkgs.has(pkg.id) ? 'Hide tranche history' : 'View tranche history'}
                                </button>
                                {expandedTranchePkgs.has(pkg.id) && (
                                  <PkgTranchesRow
                                    empowermentId={pkg.id}
                                    formatAmt={formatAmount}
                                    formatDt={formatDate}
                                  />
                                )}
                              </div>
                            )}

                            {/* CSP Waiver transfer panel — beneficiary only */}
                            {!isAdmin && !isSponsor && (pkg as any).cspWaiverEnabled && !(pkg as any).cspWaiverUsed && (
                              <div className="rounded-lg border border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/20 p-4 space-y-3">
                                <div className="flex items-start gap-2">
                                  <FiShield className="h-4 w-4 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-xs font-semibold text-violet-800 dark:text-violet-200">CSP Waiver Available</p>
                                    <p className="text-xs text-violet-700 dark:text-violet-300 mt-0.5">
                                      You can use your Education Wallet balance for a one-time CSP contribution. Transfer to Community Wallet or Cash Wallet.
                                    </p>
                                  </div>
                                </div>
                                {cspTransferPkgId !== pkg.id ? (
                                  <button
                                    onClick={() => setCspTransferPkgId(pkg.id)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-violet-300 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:border-violet-400 transition"
                                  >
                                    <FiArrowRight className="h-3.5 w-3.5" />
                                    Apply CSP Waiver Transfer
                                  </button>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-[11px] font-semibold text-violet-800 dark:text-violet-200 mb-1">Transfer To</label>
                                        <select
                                          value={cspTransferTarget}
                                          onChange={(e) => setCspTransferTarget(e.target.value as 'community' | 'wallet')}
                                          className="w-full rounded-lg border border-violet-200 dark:border-violet-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-violet-400"
                                        >
                                          <option value="community">Community Wallet</option>
                                          <option value="wallet">Cash Wallet</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-[11px] font-semibold text-violet-800 dark:text-violet-200 mb-1">Amount (₦)</label>
                                        <input
                                          type="number"
                                          placeholder="300000"
                                          value={cspTransferAmount}
                                          onChange={(e) => setCspTransferAmount(e.target.value)}
                                          className="w-full rounded-lg border border-violet-200 dark:border-violet-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-violet-400"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-semibold text-violet-800 dark:text-violet-200 mb-1">Transaction PIN</label>
                                      <input
                                        type="password"
                                        maxLength={4}
                                        placeholder="••••"
                                        value={cspTransferPin}
                                        onChange={(e) => setCspTransferPin(e.target.value)}
                                        className="w-32 rounded-lg border border-violet-200 dark:border-violet-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-xs text-gray-900 dark:text-white tracking-widest focus:outline-none focus:border-violet-400"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        disabled={!cspTransferAmount || cspTransferPin.length !== 4 || cspTransferMut.status === 'pending'}
                                        onClick={() => {
                                          cspTransferMut.mutate({
                                            amount: Number(cspTransferAmount),
                                            fromWallet: 'education',
                                            toWallet: cspTransferTarget,
                                            pin: cspTransferPin,
                                            reason: 'CSP_CONTRIBUTION',
                                          });
                                        }}
                                        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 px-4 py-1.5 text-xs font-semibold text-white transition"
                                      >
                                        {cspTransferMut.status === 'pending' ? 'Processing...' : 'Confirm Transfer'}
                                      </button>
                                      <button
                                        onClick={() => { setCspTransferPkgId(null); setCspTransferAmount(''); setCspTransferPin(''); }}
                                        className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

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
                                <button
                                  onClick={() => { setSelectedPkg(pkg); setOutcomeType((pkg as any).outcomeType ?? ''); setTranchePct(20); }}
                                  className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:border-violet-300 dark:border-violet-700/50 dark:bg-violet-900/30 dark:text-violet-200"
                                >
                                  <FiEye className="h-3.5 w-3.5" />
                                  {(pkg as any).outcomeType ? 'View / Tranches' : 'Set Outcome'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
                    { label: 'Full Approval', value: analytics.fullApprovalPackages, icon: FiAward },
                    { label: 'Decline Outcomes', value: analytics.declinePackages, icon: FiAlertTriangle },
                    { label: 'CSP Waivers Active', value: analytics.cspWaiverActive, icon: FiShield },
                    { label: 'CSP Waivers Used', value: analytics.cspWaiverUsed, icon: FiCheckCircle },
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

                {/* Outcome financial summary */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Education Wallet Credited</p>
                        <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{formatAmount(analytics.totalCredited)}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Across all tranche releases</p>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-200">
                        <FiDollarSign className="h-5 w-5" />
                      </span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Sponsor Rewards Paid</p>
                        <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{formatAmount(analytics.totalSponsorRewardsPaid)}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Across all outcome types</p>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/40 dark:text-amber-200">
                        <FiGift className="h-5 w-5" />
                      </span>
                    </div>
                  </div>
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

            {activeTab === 'config' && isAdminView && (
              <motion.div
                key="config"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-200">
                          <FiSliders className="h-4 w-4" />
                        </span>
                        Empowerment Program Configuration
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Adjust rates and thresholds. Changes are audit-logged.
                      </p>
                    </div>
                  </div>

                  {empConfigQuery.isLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-2">
                      {[
                        { key: 'empowerment:countdown_months', label: 'Countdown Months', hint: 'Duration before maturity (months)' },
                        { key: 'empowerment:gross_value', label: 'Gross Package Value (₦)', hint: 'Beneficiary gross value at release' },
                        { key: 'empowerment:csp_min_threshold', label: 'CSP Min Threshold (₦)', hint: 'Min balance for normal CSP eligibility' },
                        { key: 'empowerment:refund_interest_rate', label: 'Full Decline Interest Rate', hint: 'e.g. 0.15 = 15%' },
                        { key: 'empowerment:min_first_tranche_pct', label: 'Min First Tranche (%)', hint: 'Minimum % for the first release' },
                        { key: 'empowerment:sponsor_reward_pct_full_approval', label: 'Sponsor Reward % — Full Approval', hint: 'e.g. 0.20 = 20%' },
                        { key: 'empowerment:sponsor_reward_pct_50', label: 'Sponsor Reward % — 50% Decline', hint: 'e.g. 0.10 = 10%' },
                        { key: 'empowerment:sponsor_reward_pct_75', label: 'Sponsor Reward % — 75% Decline', hint: 'e.g. 0.05 = 5%' },
                        { key: 'empowerment:sponsor_reward_pct_other', label: 'Sponsor Reward % — Other Decline', hint: 'e.g. 0.05 = 5%' },
                      ].map(({ key, label, hint }) => (
                        <div key={key}>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1.5">{hint}</p>
                          <input
                            type="text"
                            value={configValues[key] ?? ''}
                            onChange={(e) => setConfigValues((prev) => ({ ...prev, [key]: e.target.value }))}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        if (empConfigQuery.data) setConfigValues(empConfigQuery.data as Record<string, string>);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-gray-300 transition dark:border-gray-700 dark:text-gray-300"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => updateConfigMut.mutate({ values: configValues })}
                      disabled={updateConfigMut.status === 'pending' || me?.role !== 'super_admin'}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-2 text-sm font-semibold text-white shadow transition"
                      title={me?.role !== 'super_admin' ? 'Only super-admins can save configuration changes' : undefined}
                    >
                      <FiSettings className="h-4 w-4" />
                      {updateConfigMut.status === 'pending' ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                  {me?.role !== 'super_admin' && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                      <FiAlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                      Only super-admins can save configuration changes.
                    </p>
                  )}
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

      {/* ── Outcome / Tranche Modal Overlay ── */}
      <AnimatePresence>
        {selectedPkg && isAdminView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) { setSelectedPkg(null); setOutcomeType(''); } }}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative h-full w-full max-w-xl overflow-y-auto bg-white dark:bg-bpi-dark-card shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-bpi-dark-card px-6 py-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FiLayers className="h-5 w-5 text-emerald-600" />
                    Outcome Management
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {selectedPkg.User_EmpowermentPackage_beneficiaryIdToUser?.name ?? 'Beneficiary'} —{' '}
                    {selectedPkg.empowermentType?.replace('_', ' ')}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedPkg(null); setOutcomeType(''); }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Package summary */}
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sponsor</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedPkg.User_EmpowermentPackage_sponsorIdToUser?.name ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedPkg.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Net Value</p>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatAmount(selectedPkg.netEmpowermentValue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Package Fee + VAT</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{formatAmount(selectedPkg.packageFee + selectedPkg.vat)}</p>
                  </div>
                </div>

                {/* ── Outcome Setter (only when no outcome set yet) ── */}
                {!(selectedPkg as any).outcomeType ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <FiTarget className="h-4 w-4 text-emerald-600" />
                      Set Outcome Type
                    </h3>
                    <div className="space-y-2">
                      {[
                        { value: 'FULL_APPROVAL', label: 'Full Approval', desc: 'Beneficiary receives 100% via tranches. Sponsor reward on first tranche.' },
                        { value: 'PARTIAL_DECLINE_50', label: 'Partial Decline 50%', desc: '50% credited to beneficiary education wallet. Sponsor gets 10% reward.' },
                        { value: 'PARTIAL_DECLINE_75', label: 'Partial Decline 75%', desc: '25% credited to beneficiary education wallet (75% declined). Sponsor gets 5% reward.' },
                        { value: 'PARTIAL_DECLINE_OTHER', label: 'Partial Decline (Custom %)', desc: 'Specify custom credit %. Sponsor gets 5% reward.' },
                        { value: 'FULL_DECLINE', label: 'Full Decline', desc: 'Sponsor refunded package cost + 15% interest. CSP waiver activated for beneficiary.' },
                      ].map((opt) => (
                        <label key={opt.value} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                          outcomeType === opt.value
                            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}>
                          <input
                            type="radio"
                            name="outcomeType"
                            value={opt.value}
                            checked={outcomeType === opt.value}
                            onChange={() => setOutcomeType(opt.value as OutcomeType)}
                            className="mt-0.5 accent-emerald-600"
                          />
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{opt.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    {outcomeType === 'PARTIAL_DECLINE_OTHER' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Custom Credit Percentage</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={1}
                            max={99}
                            value={customCreditPct}
                            onChange={(e) => setCustomCreditPct(Number(e.target.value))}
                            className="flex-1 accent-emerald-600"
                          />
                          <span className="w-12 text-center text-sm font-bold text-emerald-700 dark:text-emerald-300">{customCreditPct}%</span>
                        </div>
                      </div>
                    )}

                    {outcomeType && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-4 space-y-2">
                        <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-1.5">
                          <FiPieChart className="h-3.5 w-3.5" />
                          Outcome Preview
                        </h4>
                        {(() => {
                          const net = selectedPkg.netEmpowermentValue ?? 0;
                          const pkgCost = selectedPkg.packageFee ?? 0;
                          if (outcomeType === 'FULL_APPROVAL') {
                            return (
                              <>
                                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                                  <span>Beneficiary (via tranches)</span>
                                  <span className="font-semibold">{formatAmount(net)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                                  <span>Sponsor reward (30%)</span>
                                  <span className="font-semibold">{formatAmount(Math.round(pkgCost * 0.3))}</span>
                                </div>
                                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                                  <span>CSP Waiver activated?</span>
                                  <span>No</span>
                                </div>
                              </>
                            );
                          }
                          if (outcomeType === 'PARTIAL_DECLINE_50') {
                            return (
                              <>
                                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                                  <span>Beneficiary credit (50%)</span>
                                  <span className="font-semibold">{formatAmount(Math.round(net * 0.5))}</span>
                                </div>
                                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                                  <span>Sponsor reward (10%)</span>
                                  <span className="font-semibold">{formatAmount(Math.round(pkgCost * 0.1))}</span>
                                </div>
                                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                                  <span>CSP Waiver activated?</span>
                                  <span>Yes</span>
                                </div>
                              </>
                            );
                          }
                          if (outcomeType === 'PARTIAL_DECLINE_75') {
                            return (
                              <>
                                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                                  <span>Beneficiary credit (25% — 75% declined)</span>
                                  <span className="font-semibold">{formatAmount(Math.round(net * 0.25))}</span>
                                </div>
                                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                                  <span>Sponsor reward (5%)</span>
                                  <span className="font-semibold">{formatAmount(Math.round(pkgCost * 0.05))}</span>
                                </div>
                                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                                  <span>CSP Waiver activated?</span>
                                  <span>Yes</span>
                                </div>
                              </>
                            );
                          }
                          if (outcomeType === 'PARTIAL_DECLINE_OTHER') {
                            return (
                              <>
                                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                                  <span>Beneficiary credit ({customCreditPct}%)</span>
                                  <span className="font-semibold">{formatAmount(Math.round(net * customCreditPct / 100))}</span>
                                </div>
                                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                                  <span>Sponsor reward (5%)</span>
                                  <span className="font-semibold">{formatAmount(Math.round(pkgCost * 0.05))}</span>
                                </div>
                                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                                  <span>CSP Waiver activated?</span>
                                  <span>Yes</span>
                                </div>
                              </>
                            );
                          }
                          if (outcomeType === 'FULL_DECLINE') {
                            return (
                              <>
                                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                                  <span>Sponsor refund (cost + 15%)</span>
                                  <span className="font-semibold">{formatAmount(Math.round(pkgCost * 1.15))}</span>
                                </div>
                                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                                  <span>Beneficiary credit</span>
                                  <span>₦0</span>
                                </div>
                                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300">
                                  <span>CSP Waiver activated?</span>
                                  <span>Yes</span>
                                </div>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}

                    {outcomeType && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 flex items-start gap-2">
                        <FiAlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 dark:text-amber-200">
                          This action is <strong>irreversible</strong>. Funds will be moved immediately upon confirmation.
                        </p>
                      </div>
                    )}

                    <button
                      disabled={!outcomeType || setOutcomeMut.status === 'pending'}
                      onClick={() => {
                        if (!outcomeType) return;
                        setOutcomeMut.mutate({
                          empowermentId: selectedPkg.id,
                          outcomeType,
                          ...(outcomeType === 'PARTIAL_DECLINE_OTHER' ? { customCreditPct } : {}),
                        });
                      }}
                      className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold shadow transition flex items-center justify-center gap-2"
                    >
                      {setOutcomeMut.status === 'pending' ? (
                        <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" /> Processing...</>
                      ) : (
                        <><FiCheckCircle className="h-4 w-4" /> Confirm Outcome</>
                      )}
                    </button>
                  </div>
                ) : (
                  /* Outcome already set — show tranche panel for FULL_APPROVAL */
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                        (selectedPkg as any).outcomeType === 'FULL_APPROVAL'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                          : (selectedPkg as any).outcomeType === 'FULL_DECLINE'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800'
                      }`}>
                        <FiLayers className="h-3 w-3" />
                        Outcome: {(selectedPkg as any).outcomeType.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {(selectedPkg as any).outcomeType === 'FULL_APPROVAL' && (
                      <>
                        {/* Release progress */}
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Released</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {Math.round((selectedPkg as any).totalReleasedPercent ?? 0)}% ({formatAmount((selectedPkg as any).totalReleasedAmount ?? 0)})
                            </span>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                              style={{ width: `${(selectedPkg as any).totalReleasedPercent ?? 0}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Remaining: {100 - Math.round((selectedPkg as any).totalReleasedPercent ?? 0)}% (≈ {formatAmount(((selectedPkg.netEmpowermentValue ?? 0) * (1 - ((selectedPkg as any).totalReleasedPercent ?? 0) / 100)))})
                          </div>
                        </div>

                        {/* Tranche release form */}
                        {((selectedPkg as any).totalReleasedPercent ?? 0) < 100 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <FiGift className="h-4 w-4 text-emerald-600" />
                              Release New Tranche
                            </h4>
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Release Percentage</label>
                                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{tranchePct}%</span>
                              </div>
                              <input
                                type="range"
                                min={1}
                                max={100 - Math.round((selectedPkg as any).totalReleasedPercent ?? 0)}
                                value={tranchePct}
                                onChange={(e) => setTranchePct(Number(e.target.value))}
                                className="w-full accent-emerald-600"
                              />
                              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                                <span>Min: {(selectedPkg as any).totalReleasedPercent === 0 ? '20%' : '1%'}</span>
                                <span>Max: {100 - Math.round((selectedPkg as any).totalReleasedPercent ?? 0)}%</span>
                              </div>
                            </div>
                            <button
                              disabled={releaseTrancheMut.status === 'pending'}
                              onClick={() => {
                                releaseTrancheMut.mutate({ empowermentId: selectedPkg.id, percent: tranchePct });
                              }}
                              className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold shadow transition flex items-center justify-center gap-2"
                            >
                              {releaseTrancheMut.status === 'pending' ? (
                                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" /> Releasing...</>
                              ) : (
                                <><FiSend className="h-4 w-4" /> Release {tranchePct}% Tranche</>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Tranche history */}
                        {trancheQuery.data && trancheQuery.data.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <FiLayers className="h-4 w-4 text-gray-500" />
                                Tranche History
                              </h4>
                              <button
                                onClick={() => {
                                  const rows = [
                                    ['Tranche #', 'Percent', 'Net Amount', 'Tax Amount', 'Released At'],
                                    ...(trancheQuery.data ?? []).map((t: any) => [
                                      t.trancheNumber,
                                      `${t.percent}%`,
                                      t.netAmount,
                                      t.taxAmount ?? 0,
                                      t.releasedAt ? new Date(t.releasedAt).toLocaleDateString() : '',
                                    ]),
                                  ];
                                  const csv = rows.map((r) => r.join(',')).join('\n');
                                  const blob = new Blob([csv], { type: 'text/csv' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `tranches-${selectedPkg?.id ?? 'pkg'}.csv`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition dark:border-gray-700 dark:text-gray-400"
                              >
                                <FiDownload className="h-3 w-3" />
                                Export CSV
                              </button>
                            </div>
                            <div className="space-y-2">
                              {trancheQuery.data.map((t: any) => (
                                <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 font-bold text-[10px]">
                                      {t.trancheNumber}
                                    </span>
                                    <span className="text-gray-700 dark:text-gray-300">{t.percent}%</span>
                                    <span className="text-gray-400 dark:text-gray-500">· {formatDate(t.releasedAt)}</span>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatAmount(t.netAmount)}</p>
                                    <p className="text-gray-400 dark:text-gray-500">net</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* CSP Waiver status */}
                    {(selectedPkg as any).cspWaiverEnabled && (
                      <div className="rounded-lg border border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30 p-3 flex items-start gap-2">
                        <FiShield className="h-4 w-4 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-violet-800 dark:text-violet-200">CSP Waiver Active</p>
                          <p className="text-xs text-violet-700 dark:text-violet-300 mt-0.5">
                            Beneficiary is eligible for one CSP approval via education wallet transfer.{' '}
                            {(selectedPkg as any).cspWaiverUsed ? <strong>Already used.</strong> : 'Not yet used.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
