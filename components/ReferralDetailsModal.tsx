"use client";
import { useState } from "react";
import { X, ChevronDown, ChevronUp, Users, TrendingUp, Calendar, Mail, Phone, Award, AlertCircle, CheckCircle, Download, Search, Filter, UserPlus, Bell, BarChart3, ExternalLink, Zap, DollarSign, Coins, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Modal } from "./ui/Modal";
import { api } from "@/client/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";
import Image from "next/image";

interface ReferralDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReferralDetailsModal({ isOpen, onClose }: ReferralDetailsModalProps) {
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3 | 4>(1);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [expandedAnalytics, setExpandedAnalytics] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [convertingUserId, setConvertingUserId] = useState<string | null>(null);
  const [removingContactEmail, setRemovingContactEmail] = useState<string | null>(null);
  const [remindingUserId, setRemindingUserId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{type: 'convert' | 'remove' | 'success' | 'error', message: string, data?: any} | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const { formatAmount } = useCurrency();
  const utils = api.useUtils();

  // Fetch detailed referral tree
  const { data: referralTree, isLoading } = api.referral.getDetailedReferralTree.useQuery(
    undefined,
    { enabled: isOpen }
  );

  // Convert to contact mutation
  const convertToContact = api.referral.convertReferralToContact.useMutation({
    onSuccess: async () => {
      await utils.referral.getDetailedReferralTree.refetch();
      await utils.referral.getDailyInviteCount.refetch();
    }
  });

  // Remove contact mutation (for testing/fixing transactions)
  const removeContact = api.referral.removeContact.useMutation({
    onSuccess: async () => {
      await utils.referral.getDetailedReferralTree.refetch();
    }
  });

  // Send activation reminder mutation
  const sendReminder = api.referral.sendActivationReminder.useMutation({
    onSuccess: () => {
      setRemindingUserId(null);
    }
  });

  if (!isOpen) return null;

  const toggleUserExpanded = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const toggleAnalytics = (userId: string) => {
    const newExpanded = new Set(expandedAnalytics);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedAnalytics(newExpanded);
  };

  const handleConvertToContact = async (userId: string, userName: string, userEmail: string) => {
    setConfirmModal({
      type: 'convert',
      message: `Convert ${userName} to a contact for 0.75 BPT?`,
      data: { userId, userName, userEmail }
    });
  };

  const confirmConvertToContact = async () => {
    if (!confirmModal?.data) return;
    const { userId, userName, userEmail } = confirmModal.data;
    setConfirmModal(null);
    setConvertingUserId(userId);
    try {
      await convertToContact.mutateAsync({ 
        referralUserId: userId,
        name: userName,
        email: userEmail
      });
      setConfirmModal({ type: 'success', message: `${userName} has been added to your contacts!` });
    } catch (error: any) {
      setConfirmModal({ type: 'error', message: error.message || "Failed to convert to contact" });
    } finally {
      setConvertingUserId(null);
    }
  };

  const handleRemoveContact = async (userName: string, userEmail: string) => {
    setConfirmModal({
      type: 'remove',
      message: `Remove ${userName} from contacts? Your BPT will be refunded.`,
      data: { userName, userEmail }
    });
  };

  const confirmRemoveContact = async () => {
    if (!confirmModal?.data) return;
    const { userName, userEmail } = confirmModal.data;
    setConfirmModal(null);
    setRemovingContactEmail(userEmail);
    try {
      const result = await removeContact.mutateAsync({ email: userEmail });
      setConfirmModal({ 
        type: 'success', 
        message: `${userName} removed from contacts. ${result.refundedBpt} BPT refunded.` 
      });
    } catch (error: any) {
      setConfirmModal({ type: 'error', message: error.message || "Failed to remove contact" });
    } finally {
      setRemovingContactEmail(null);
    }
  };

  const handleSendReminder = async (userId: string, userName: string) => {
    setRemindingUserId(userId);
    try {
      await sendReminder.mutateAsync({ userId });
      setConfirmModal({ type: 'success', message: `Activation reminder sent to ${userName}!` });
    } catch (error: any) {
      setConfirmModal({ type: 'error', message: error.message || "Failed to send reminder" });
    } finally {
      setRemindingUserId(null);
    }
  };

  const handleExport = () => {
    if (!filteredData || filteredData.length === 0) {
      setConfirmModal({ type: 'error', message: 'No referrals to export' });
      return;
    }

    setIsExporting(true);
    try {
      const headers = ["Name", "Email", "Phone", "Status", "Package", "Joined Date", "Total Referrals", "Earnings"];
      const csvData = filteredData.map((user: any) => [
        user.name || `${user.firstname || ''} ${user.lastname || ''}`.trim(),
        user.email || 'N/A',
        user.mobile || 'N/A',
        getMembershipStatus(user).text,
        user.membershipPackage || 'None',
        new Date(user.createdAt).toLocaleDateString(),
        user.totalReferrals || 0,
        formatAmount(user.earningsFromThisReferral || 0)
      ]);

      const csvContent = [
        headers.join(","),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `referrals_level${activeLevel}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setConfirmModal({ type: 'success', message: `Exported ${filteredData.length} referrals successfully!` });
    } catch (error) {
      setConfirmModal({ type: 'error', message: 'Failed to export referrals' });
    } finally {
      setIsExporting(false);
    }
  };

  const getLevelData = () => {
    if (!referralTree) return [];
    switch (activeLevel) {
      case 1: return referralTree.level1 || [];
      case 2: return referralTree.level2 || [];
      case 3: return referralTree.level3 || [];
      case 4: return referralTree.level4 || [];
      default: return [];
    }
  };

  const filteredData = getLevelData().filter((user: any) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMembershipStatus = (user: any) => {
    if (!user.activeMembership) return { color: 'red', text: 'No Membership', icon: AlertCircle };
    if (user.membershipExpired) return { color: 'orange', text: 'Expired', icon: AlertCircle };
    if (user.membershipExpiringSoon) return { color: 'yellow', text: 'Expiring Soon', icon: AlertCircle };
    return { color: 'green', text: 'Active', icon: CheckCircle };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getLevelCount = (level: number): number => {
    if (!referralTree) return 0;
    const key = `level${level}Count` as 'level1Count' | 'level2Count' | 'level3Count' | 'level4Count';
    return (referralTree[key] as number) || 0;
  };

  return (
    <>
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-bpi-dark-card rounded-2xl w-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 text-white p-8 rounded-t-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">
                    Referral Network Details
                  </h2>
                  <p className="text-green-100 text-sm mt-1">
                    Manage your 4-level referral network
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 border-b border-green-200 dark:border-green-800">
          <div className="text-center bg-white/80 dark:bg-bpi-dark-card/80 rounded-xl p-4 backdrop-blur-sm shadow-sm">
            <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{referralTree?.totalReferrals || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Team</p>
          </div>
          <div className="text-center bg-white/80 dark:bg-bpi-dark-card/80 rounded-xl p-4 backdrop-blur-sm shadow-sm">
            <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{referralTree?.totalCashEarnings ? formatAmount(referralTree.totalCashEarnings) : formatAmount(0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Cash Earnings</p>
          </div>
          <div className="text-center bg-white/80 dark:bg-bpi-dark-card/80 rounded-xl p-4 backdrop-blur-sm shadow-sm">
            <p className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">{referralTree?.totalPalliativeEarnings ? formatAmount(referralTree.totalPalliativeEarnings) : formatAmount(0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Palliative Earnings</p>
          </div>
          <div className="text-center bg-white/80 dark:bg-bpi-dark-card/80 rounded-xl p-4 backdrop-blur-sm shadow-sm">
            <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">{referralTree?.totalBptEarnings || 0} BPT</p>
            <p className="text-xs text-muted-foreground mt-1">BPT Earnings</p>
          </div>
        </div>

        {/* Level Tabs */}
        <div className="flex gap-2 p-5 border-b border-gray-200 dark:border-bpi-dark-accent overflow-x-auto bg-gray-50 dark:bg-bpi-dark-accent/20">
          {[1, 2, 3, 4].map((level) => (
            <button
              key={level}
              onClick={() => setActiveLevel(level as 1 | 2 | 3 | 4)}
              className={`px-5 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                activeLevel === level
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg transform scale-105'
                  : 'bg-white dark:bg-bpi-dark-card text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 border border-gray-200 dark:border-bpi-dark-accent'
              }`}
            >
              Level {level}: {getLevelCount(level)} Members
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="p-4 border-b border-gray-200 dark:border-bpi-dark-accent flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-bpi-dark-accent rounded-lg bg-white dark:bg-bpi-dark-accent text-foreground focus:ring-2 focus:ring-bpi-primary focus:border-transparent"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
            disabled={isExporting || filteredData.length === 0}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-bpi-primary"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading referrals...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No referrals match your search' : `No Level ${activeLevel} referrals yet`}
              </p>
            </div>
          ) : (
            <>
              {filteredData.map((user: any) => {
                const isExpanded = expandedUsers.has(user.id);
                const status = getMembershipStatus(user);
                const StatusIcon = status.icon;

                return (
                <div
                  key={user.id}
                  className="border-2 border-gray-200 dark:border-bpi-dark-accent rounded-xl overflow-hidden bg-white dark:bg-bpi-dark-card/50 hover:shadow-lg hover:border-green-300 dark:hover:border-green-700 transition-all duration-300 mx-2"
                >
                  {/* Collapsed View */}
                  <div
                    onClick={() => toggleUserExpanded(user.id)}
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-bpi-dark-accent/30 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                      {user.image ? (
                        <Image src={user.image} alt={user.name} width={48} height={48} className="rounded-full w-full h-full object-cover" />
                      ) : (
                        getInitials(user.name || 'User')
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{user.name || 'Member'}</h3>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusIcon className={`w-3 h-3 text-${status.color}-500`} />
                        <span className={`text-xs font-medium text-${status.color}-600`}>{status.text}</span>
                        <span className="text-xs text-muted-foreground">• Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Expand Icon */}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {/* Expanded View */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-bpi-dark-accent p-5 space-y-4 bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/30 dark:from-bpi-dark-accent/20 dark:via-green-900/10 dark:to-emerald-900/10">
                      {/* Full Snapshot */}
                      <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-5 border-2 border-green-200 dark:border-green-800 shadow-sm mx-2">
                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                            <BarChart3 className="w-4 h-4 text-white" />
                          </div>
                          Member Snapshot
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Full Name</p>
                            <p className="font-medium text-foreground">{user.firstname} {user.lastname}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Email</p>
                            <p className="font-medium text-foreground truncate">{user.email}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Phone</p>
                            <p className="font-medium text-foreground">{user.mobile || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Membership</p>
                            <p className="font-medium text-foreground">{user.membershipPackage || 'None'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Package Expires</p>
                            <p className="font-medium text-foreground">
                              {user.membershipExpiresAt ? new Date(user.membershipExpiresAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Referrals</p>
                            <p className="font-medium text-foreground">{user.totalReferrals || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Join Date</p>
                            <p className="font-medium text-foreground">{new Date(user.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Your Earnings</p>
                            <p className="font-medium text-green-600">{formatAmount(user.earningsFromThisReferral || 0)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Their Referral Tree */}
                      {user.subTree && (user.subTree.level1Count > 0 || user.subTree.level2Count > 0 || user.subTree.level3Count > 0) && (
                        <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-5 border-2 border-teal-200 dark:border-teal-800 shadow-sm mx-2">
                          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <div className="p-1.5 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg">
                              <Users className="w-4 h-4 text-white" />
                            </div>
                            Their Referral Network
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Level 1 (Your Level {activeLevel + 1}):</span>
                              <span className="font-medium text-foreground">{user.subTree.level1Count || 0} members</span>
                            </div>
                            {activeLevel < 3 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Level 2 (Your Level {activeLevel + 2}):</span>
                                <span className="font-medium text-foreground">{user.subTree.level2Count || 0} members</span>
                              </div>
                            )}
                            {activeLevel < 2 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Level 3 (Your Level {activeLevel + 3}):</span>
                                <span className="font-medium text-foreground">{user.subTree.level3Count || 0} members</span>
                              </div>
                            )}
                            <div className="pt-2 border-t border-gray-200 dark:border-bpi-dark-accent flex justify-between">
                              <span className="font-semibold text-foreground">Total Network:</span>
                              <span className="font-semibold text-bpi-primary">{user.subTree.totalCount || 0} members</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="bg-white dark:bg-bpi-dark-card rounded-lg overflow-hidden border-2 border-blue-200 dark:border-blue-800 shadow-sm mx-2">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Quick Actions
                          </h4>
                        </div>
                        <div className="p-4 flex flex-wrap gap-2">
                          {!user.isContact && (
                            <button
                              onClick={() => handleConvertToContact(user.id, user.name, user.email)}
                              disabled={convertingUserId === user.id}
                              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium text-sm hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                              {convertingUserId === user.id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Converting...
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-4 h-4" />
                                  Convert to Contact (0.75 BPT)
                                </>
                              )}
                            </button>
                          )}
                          {user.isContact && (
                            <button
                              onClick={() => handleRemoveContact(user.name, user.email)}
                              disabled={removingContactEmail === user.email}
                              className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg font-medium text-sm hover:from-red-700 hover:to-rose-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                              {removingContactEmail === user.email ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Removing...
                                </>
                              ) : (
                                <>
                                  <X className="w-4 h-4" />
                                  Remove Contact (Refund BPT)
                                </>
                              )}
                            </button>
                          )}
                          {!user.activeMembership && (
                            <button
                              onClick={() => handleSendReminder(user.id, user.name)}
                              disabled={remindingUserId === user.id}
                              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-medium text-sm hover:from-orange-600 hover:to-amber-600 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                              {remindingUserId === user.id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Bell className="w-4 h-4" />
                                  Remind to Activate
                                </>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => toggleAnalytics(user.id)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center gap-2 shadow-md"
                          >
                            <BarChart3 className="w-4 h-4" />
                            {expandedAnalytics.has(user.id) ? 'Hide' : 'View'} Analytics
                            {expandedAnalytics.has(user.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Full Analytics Dropdown */}
                      {expandedAnalytics.has(user.id) && (
                        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-lg overflow-hidden border-2 border-blue-300 dark:border-blue-700 shadow-lg mx-2 animate-slideDown">
                          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
                            <h4 className="font-bold text-lg flex items-center gap-2">
                              <BarChart3 className="w-5 h-5" />
                              Detailed Analytics for {user.name}
                            </h4>
                          </div>
                          
                          <div className="p-5 space-y-4">
                            {/* Earnings Breakdown */}
                            <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-4 shadow-sm">
                              <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                Your Earnings from This Referral
                              </h5>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                  <p className="text-xs text-muted-foreground mb-1">Cash Wallet</p>
                                  <p className="text-xl font-bold text-green-700 dark:text-green-400">
                                    {formatAmount(user.earningsBreakdown?.cash || 0)}
                                  </p>
                                </div>
                                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-3 rounded-lg border border-teal-200 dark:border-teal-800">
                                  <p className="text-xs text-muted-foreground mb-1">Palliative Wallet</p>
                                  <p className="text-xl font-bold text-teal-700 dark:text-teal-400">
                                    {formatAmount(user.earningsBreakdown?.palliative || 0)}
                                  </p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                  <p className="text-xs text-muted-foreground mb-1">Cashback Wallet</p>
                                  <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                                    {formatAmount(user.earningsBreakdown?.cashback || 0)}
                                  </p>
                                </div>
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                                  <p className="text-xs text-muted-foreground mb-1">BPT Wallet</p>
                                  <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
                                    {user.earningsBreakdown?.bpt || 0} BPT
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-bpi-dark-accent">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-foreground">Total Cash Value:</span>
                                  <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                    {formatAmount(user.earningsFromThisReferral || 0)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Performance Metrics */}
                            <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-4 shadow-sm">
                              <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                Performance Metrics
                              </h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Member Status:</span>
                                  <span className={`font-semibold ${
                                    user.activeMembership ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {user.activeMembership ? '✓ Active Member' : '✗ Inactive'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Package Type:</span>
                                  <span className="font-semibold text-foreground">
                                    {user.membershipPackage}
                                    {user.membershipPackagePrice ? ` (${formatAmount(user.membershipPackagePrice)})` : ''}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Package Status:</span>
                                  <span className={`font-semibold ${
                                    user.membershipExpired ? 'text-red-600' : 
                                    user.membershipExpiringSoon ? 'text-orange-600' : 
                                    'text-green-600'
                                  }`}>
                                    {user.membershipExpired ? 'Expired' : 
                                     user.membershipExpiringSoon ? 'Expiring Soon' : 
                                     'Active'}
                                  </span>
                                </div>
                                {user.membershipExpiresAt && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Expires On:</span>
                                    <span className="font-semibold text-foreground">
                                      {new Date(user.membershipExpiresAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Join Date:</span>
                                  <span className="font-semibold text-foreground">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Days as Member:</span>
                                  <span className="font-semibold text-foreground">
                                    {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Network Performance */}
                            <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-4 shadow-sm">
                              <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Users className="w-4 h-4 text-purple-600" />
                                Network Performance
                              </h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total Team Size:</span>
                                  <span className="font-bold text-purple-600">{user.totalReferrals} members</span>
                                </div>
                                {user.subTree && (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground pl-4">• Their Level 1:</span>
                                      <span className="font-semibold text-foreground">{user.subTree.level1Count}</span>
                                    </div>
                                    {user.subTree.level2Count > 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground pl-4">• Their Level 2:</span>
                                        <span className="font-semibold text-foreground">{user.subTree.level2Count}</span>
                                      </div>
                                    )}
                                    {user.subTree.level3Count > 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground pl-4">• Their Level 3:</span>
                                        <span className="font-semibold text-foreground">{user.subTree.level3Count}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Contact Status */}
                            <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-4 shadow-sm">
                              <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Award className="w-4 h-4 text-indigo-600" />
                                Relationship Status
                              </h5>
                              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                <span className="text-sm font-medium text-foreground">Contact Status:</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  user.isContact 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                }`}>
                                  {user.isContact ? '✓ In Your Contacts' : 'Not a Contact'}
                                </span>
                              </div>
                              {!user.isContact && (
                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                  💡 Convert to contact for 0.75 BPT to unlock direct messaging
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>

    {/* Confirmation Modals */}
    {confirmModal && confirmModal.type && (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-bpi-dark-card rounded-xl w-full max-w-md relative shadow-2xl">
          <button
            onClick={() => setConfirmModal(null)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="p-6">
            <h3 className="text-xl font-bold text-center mb-6">
              {confirmModal.type === 'convert' || confirmModal.type === 'remove' ? 'Confirm Action' : confirmModal.type === 'success' ? 'Success' : 'Error'}
            </h3>
            <div className="text-center py-4">
              {confirmModal.type === 'convert' ? (
                <>
                  <UserPlus className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                  <p className="text-lg mb-6">{confirmModal.message}</p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setConfirmModal(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={confirmConvertToContact}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Confirm (0.75 BPT)
                    </Button>
                  </div>
                </>
              ) : confirmModal.type === 'remove' ? (
                <>
                  <X className="w-16 h-16 mx-auto mb-4 text-red-600" />
                  <p className="text-lg mb-6">{confirmModal.message}</p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setConfirmModal(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={confirmRemoveContact}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Confirm Removal
                    </Button>
                  </div>
                </>
              ) : confirmModal.type === 'success' ? (
                <>
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                  <p className="text-lg mb-4">{confirmModal.message}</p>
                  <Button onClick={() => setConfirmModal(null)}>
                    Close
                  </Button>
                </>
              ) : (
                <>
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
                  <p className="text-lg mb-4">{confirmModal.message}</p>
                  <Button onClick={() => setConfirmModal(null)} variant="outline">
                    Close
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
