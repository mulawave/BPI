"use client";

import { useMemo, useState } from "react";
import { FiX } from "react-icons/fi";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  LayoutGrid,
  Link as LinkIcon,
  ListChecks,
  Save,
  Users,
} from "lucide-react";
import { api } from "@/client/trpc";
import { Button } from "@/components/ui/button";

type TabType = "overview" | "nodes" | "history";

interface ThirdPartyMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LinkAlert = {
  type: "error" | "success";
  message: string;
};

export default function ThirdPartyMatrixModal({ isOpen, onClose }: ThirdPartyMatrixModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [newLinks, setNewLinks] = useState<Record<string, string>>({});
  const [submittingPlatformId, setSubmittingPlatformId] = useState<string | null>(null);
  const [linkAlerts, setLinkAlerts] = useState<Record<string, LinkAlert>>({});

  const utils = api.useUtils();

  const { data: summary, isLoading: loadingSummary } = api.thirdPartyMatrix.getSummary.useQuery(undefined, {
    enabled: isOpen,
    staleTime: 60 * 1000,
  });
  const { data: nodes, isLoading: loadingNodes } = api.thirdPartyMatrix.getMyNodes.useQuery(undefined, {
    enabled: isOpen,
    staleTime: 60 * 1000,
  });
  const { data: history, isLoading: loadingHistory } = api.thirdPartyMatrix.getPlacementHistory.useQuery(
    { limit: 80 },
    { enabled: isOpen, staleTime: 30 * 1000 }
  );
  const { data: teamReport } = api.thirdPartyMatrix.getTeamReport.useQuery(undefined, {
    enabled: isOpen,
    staleTime: 60 * 1000,
  });
  const { data: availablePlatforms, isLoading: loadingAvailable } = api.thirdPartyPlatforms.getAvailablePlatforms.useQuery(undefined, {
    enabled: isOpen,
    staleTime: 60 * 1000,
  });
  const { data: myPlatforms, isLoading: loadingMyPlatforms } = api.thirdPartyPlatforms.getMyPlatformsWithStats.useQuery(undefined, {
    enabled: isOpen,
    staleTime: 60 * 1000,
  });

  const submitLink = api.thirdPartyPlatforms.submitReferralLink.useMutation({
    onSuccess: async (data) => {
      if (submittingPlatformId) {
        setLinkAlerts((prev) => ({
          ...prev,
          [submittingPlatformId]: {
            type: "success",
            message: data.message || "Referral link saved successfully.",
          },
        }));
      }
      setSubmittingPlatformId(null);
      setNewLinks({});
      await utils.thirdPartyPlatforms.getAvailablePlatforms.invalidate();
      await utils.thirdPartyPlatforms.getMyPlatformsWithStats.invalidate();
      await utils.thirdPartyPlatforms.getSummary.invalidate();
    },
    onError: (error) => {
      if (submittingPlatformId) {
        let message = "Failed to save referral link. Please try again.";
        const fieldErrors = (error as any)?.data?.zodError?.fieldErrors;
        const referralErrors = fieldErrors?.referralLink as string[] | undefined;

        if (referralErrors && referralErrors.length > 0) {
          message = referralErrors[0] || message;
        } else if ((error as any)?.message) {
          const raw = String((error as any).message);
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const urlIssue = parsed.find((issue: any) => issue?.path?.includes?.("referralLink"));
              if (urlIssue?.message) {
                message = String(urlIssue.message);
              }
            }
          } catch {
            message = raw;
          }
        }

        setLinkAlerts((prev) => ({
          ...prev,
          [submittingPlatformId]: {
            type: "error",
            message,
          },
        }));
      }
      setSubmittingPlatformId(null);
    },
  });

  const markRegistration = api.thirdPartyPlatforms.markRegistration.useMutation();

  const healthTone = useMemo(() => {
    if (!summary) return "neutral";
    if (summary.imbalance <= 1) return "healthy";
    if (summary.imbalance <= 3) return "watch";
    return "risk";
  }, [summary]);

  if (!isOpen) return null;

  const handleSubmitLink = (platformId: string) => {
    const link = (newLinks[platformId] || "").trim();
    if (!link) {
      setLinkAlerts((prev) => ({
        ...prev,
        [platformId]: {
          type: "error",
          message: "Please enter your referral link.",
        },
      }));
      return;
    }

    setLinkAlerts((prev) => ({ ...prev, [platformId]: undefined as any }));
    setSubmittingPlatformId(platformId);
    submitLink.mutate({ platformId, referralLink: link });
  };

  const handleOpenSponsorLink = (platformId: string, link: string) => {
    markRegistration.mutate({ platformId });
    window.open(link, "_blank");
  };

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "nodes" as const, label: "Nodes", icon: LayoutGrid },
    { id: "history" as const, label: "Placement Timeline", icon: ListChecks },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card shadow-2xl animate-fadeIn max-h-[96dvh] sm:max-h-[90vh]">
        <div className="sticky top-0 z-20 bg-gradient-to-r from-emerald-700 via-green-700 to-teal-700 text-white flex-shrink-0">
          <div className="px-3 pt-3 pb-2 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 rounded-full bg-white/20 backdrop-blur-sm">
                  <GitBranch className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold leading-tight">Third Party Matrix</h2>
                  <p className="hidden sm:block text-emerald-100 text-sm">Binary auto-balanced team placement</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
                aria-label="Close matrix modal"
              >
                <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
              <div className="bg-white/10 rounded-lg p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-white/70 mb-0.5">Nodes</p>
                <p className="text-lg sm:text-2xl font-bold">{summary?.totalNodes ?? 0}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-white/70 mb-0.5">Placements</p>
                <p className="text-lg sm:text-2xl font-bold">{summary?.totalPlacements ?? 0}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-white/70 mb-0.5">Open Legs</p>
                <p className="text-lg sm:text-2xl font-bold">{summary?.openLegs ?? 0}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 sm:p-3 col-span-1 sm:col-span-1">
                <p className="text-[10px] sm:text-xs text-white/70 mb-0.5">Balance</p>
                <p className="text-lg sm:text-2xl font-bold">{summary?.imbalance ?? 0}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 sm:p-3 col-span-2 sm:col-span-1">
                <p className="text-[10px] sm:text-xs text-white/70 mb-0.5">Completion</p>
                <p className="text-lg sm:text-2xl font-bold">{teamReport?.completionRate ?? 0}%</p>
              </div>
            </div>

            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === id ? "bg-white text-emerald-700" : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden min-[380px]:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1 min-h-0">
          {activeTab === "overview" && (
            <div className="space-y-4 animate-fadeIn">
              {loadingSummary ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-muted-foreground mt-3">Loading matrix overview...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-bpi-border dark:border-bpi-dark-accent p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-foreground">Leg Distribution</p>
                        <Users className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Left</span>
                          <span className="font-semibold text-foreground">{summary?.leftPlacements ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Right</span>
                          <span className="font-semibold text-foreground">{summary?.rightPlacements ?? 0}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white dark:bg-bpi-dark-card overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                            style={{
                              width: `${
                                (summary?.leftPlacements || 0) + (summary?.rightPlacements || 0)
                                  ? Math.round(
                                      ((summary?.leftPlacements || 0) /
                                        ((summary?.leftPlacements || 0) + (summary?.rightPlacements || 0))) *
                                        100
                                    )
                                  : 50
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-bpi-border dark:border-bpi-dark-accent p-4 bg-white dark:bg-bpi-dark-card">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-foreground">Balance Health</p>
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                      </div>
                      <p
                        className={`text-xs font-semibold inline-flex px-2 py-1 rounded-full border ${
                          healthTone === "healthy"
                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                            : healthTone === "watch"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
                              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                        }`}
                      >
                        {healthTone === "healthy" ? "Healthy" : healthTone === "watch" ? "Monitor" : "Needs attention"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Next tie-break leg: <span className="font-semibold text-foreground">{summary?.nextPreferredLeg ?? "LEFT"}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last placement leg: <span className="font-semibold text-foreground">{summary?.lastPlacementLeg ?? "N/A"}</span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-bpi-border dark:border-bpi-dark-accent p-4 bg-white dark:bg-bpi-dark-card">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-foreground">Team Progress</p>
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-foreground">{teamReport?.completionRate ?? 0}%</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {teamReport?.placedTeam ?? 0}/{teamReport?.directDownlines ?? 0} downlines placed
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Today placements: {teamReport?.todayPlacements ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-bpi-border dark:border-bpi-dark-accent bg-gray-50 dark:bg-bpi-dark-accent/30 p-4">
                    <p className="text-sm font-semibold text-foreground mb-2">How Matrix Placement Works</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Each node has only two legs: left and right.</li>
                      <li>When both legs are open and balanced, placement alternates per sponsor.</li>
                      <li>When one side is weaker, the weaker side is filled first.</li>
                      <li>When a node is full, a new node is auto-created for that sponsor.</li>
                    </ol>
                  </div>

                  <div className="rounded-xl border border-bpi-border dark:border-bpi-dark-accent p-4 bg-white dark:bg-bpi-dark-card">
                    <div className="flex items-center gap-2 mb-3">
                      <LinkIcon className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm font-semibold text-foreground">Third-Party Referral Links</p>
                    </div>

                    {loadingAvailable ? (
                      <p className="text-sm text-muted-foreground">Loading your available links...</p>
                    ) : !availablePlatforms || availablePlatforms.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-bpi-border dark:border-bpi-dark-accent p-4 text-sm text-muted-foreground">
                        No available links yet. Ask your upline or assigned admin owner to set a platform link.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {availablePlatforms.map((platform: any) => (
                          <div
                            key={platform.id}
                            className="rounded-lg border border-bpi-border dark:border-bpi-dark-accent p-3 bg-gray-50/60 dark:bg-bpi-dark-accent/20"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{platform.name}</p>
                                <p className="text-xs text-muted-foreground">Owner: {platform.linkOwner || "Upline"}</p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleOpenSponsorLink(platform.id, platform.referralLink)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                Open Link
                              </Button>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="url"
                                placeholder="Paste your own referral link after registration"
                                value={newLinks[platform.id] || ""}
                                onChange={(e) =>
                                  {
                                    setNewLinks((prev) => ({ ...prev, [platform.id]: e.target.value }));
                                    if (linkAlerts[platform.id]) {
                                      setLinkAlerts((prev) => ({ ...prev, [platform.id]: undefined as any }));
                                    }
                                  }
                                }
                                className="flex-1 px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                                disabled={submittingPlatformId === platform.id}
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleSubmitLink(platform.id)}
                                disabled={submittingPlatformId === platform.id || !(newLinks[platform.id] || "").trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white sm:flex-shrink-0"
                              >
                                <Save className="w-3.5 h-3.5 mr-1.5" />
                                {submittingPlatformId === platform.id ? "Saving..." : "Save"}
                              </Button>
                            </div>

                            {linkAlerts[platform.id] && (
                              <div
                                className={`mt-2 rounded-lg border px-3 py-2 text-sm flex items-start gap-2 ${
                                  linkAlerts[platform.id].type === "success"
                                    ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200"
                                    : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200"
                                }`}
                              >
                                {linkAlerts[platform.id].type === "success" ? (
                                  <CheckCircle2 className="w-4 h-4 mt-0.5" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 mt-0.5" />
                                )}
                                <span className="flex-1">{linkAlerts[platform.id].message}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-bpi-border dark:border-bpi-dark-accent p-4 bg-white dark:bg-bpi-dark-card">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-semibold text-foreground">Your Submitted Link Data</p>
                    </div>

                    {loadingMyPlatforms ? (
                      <p className="text-sm text-muted-foreground">Loading submitted link data...</p>
                    ) : !myPlatforms || myPlatforms.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-bpi-border dark:border-bpi-dark-accent p-4 text-sm text-muted-foreground">
                        No submitted links yet. Submit a referral link above after registering on a platform.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myPlatforms.map((item: any) => (
                          <div
                            key={item.platform.id}
                            className="rounded-lg border border-bpi-border dark:border-bpi-dark-accent p-3 bg-gray-50/60 dark:bg-bpi-dark-accent/20"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{item.platform.name}</p>
                                <p className="text-xs text-muted-foreground">Submitted referral link</p>
                              </div>
                              <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                {item.completionRate}% complete
                              </span>
                            </div>

                            <div className="rounded-md border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card px-3 py-2 text-xs text-muted-foreground font-mono break-all mb-3">
                              {item.referralLink}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground mb-3">
                              <span>
                                Submitted: {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "N/A"}
                              </span>
                              <span>
                                Last updated: {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "N/A"}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div className="rounded-md border border-bpi-border dark:border-bpi-dark-accent px-2 py-1.5">
                                <p className="text-muted-foreground">Team</p>
                                <p className="font-semibold text-foreground">{item.totalDirectDownlines}</p>
                              </div>
                              <div className="rounded-md border border-bpi-border dark:border-bpi-dark-accent px-2 py-1.5">
                                <p className="text-muted-foreground">Registered</p>
                                <p className="font-semibold text-emerald-700 dark:text-emerald-300">{item.registeredCount}</p>
                              </div>
                              <div className="rounded-md border border-bpi-border dark:border-bpi-dark-accent px-2 py-1.5">
                                <p className="text-muted-foreground">Pending</p>
                                <p className="font-semibold text-orange-700 dark:text-orange-300">{item.pendingCount}</p>
                              </div>
                              <div className="rounded-md border border-bpi-border dark:border-bpi-dark-accent px-2 py-1.5">
                                <p className="text-muted-foreground">Completion</p>
                                <p className="font-semibold text-foreground">{item.completionRate}%</p>
                              </div>
                            </div>

                            <div className="h-2 rounded-full bg-white dark:bg-bpi-dark-card border border-bpi-border dark:border-bpi-dark-accent overflow-hidden mt-3">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                style={{ width: `${Math.min(100, Math.max(0, item.completionRate || 0))}%` }}
                              />
                            </div>

                            <div className="mt-3">
                              <p className="text-[11px] font-semibold text-muted-foreground mb-1">Recent Registrants</p>
                              {item.registeredUsers?.length ? (
                                <div className="space-y-1.5">
                                  {item.registeredUsers.slice(0, 3).map((u: any, idx: number) => (
                                    <div key={`${u.name}-${idx}`} className="flex items-center justify-between text-xs">
                                      <span className="text-foreground">{u.name}</span>
                                      <span className="text-muted-foreground">{new Date(u.registeredAt).toLocaleDateString()}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">No team registrations yet.</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </>
              )}
            </div>
          )}

          {activeTab === "nodes" && (
            <div className="space-y-4 animate-fadeIn">
              {loadingNodes ? (
                <p className="text-sm text-muted-foreground">Loading matrix nodes...</p>
              ) : !nodes || nodes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-bpi-border dark:border-bpi-dark-accent p-8 text-center">
                  <LayoutGrid className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No matrix nodes yet. Nodes are created automatically as your downline grows.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {nodes.map((node) => (
                    <div
                      key={node.id}
                      className="rounded-xl border border-bpi-border dark:border-bpi-dark-accent p-4 bg-white dark:bg-bpi-dark-card"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-foreground">Node #{node.sequence}</p>
                        <span className="text-xs text-muted-foreground">Updated {new Date(node.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300 mb-1">Left</p>
                          <p className="text-sm font-medium text-foreground">{node.leftUser?.name ?? "Open"}</p>
                        </div>
                        <div className="rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-teal-700 dark:text-teal-300 mb-1">Right</p>
                          <p className="text-sm font-medium text-foreground">{node.rightUser?.name ?? "Open"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-3 animate-fadeIn">
              {loadingHistory ? (
                <p className="text-sm text-muted-foreground">Loading placement timeline...</p>
              ) : !history || history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-bpi-border dark:border-bpi-dark-accent p-8 text-center">
                  <ListChecks className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No placement history yet.</p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-bpi-border dark:border-bpi-dark-accent bg-white dark:bg-bpi-dark-card p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.user.name}</p>
                        <p className="text-xs text-muted-foreground">Node {item.nodeId.slice(0, 8)} • {item.decisionBranch}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold border border-bpi-border dark:border-bpi-dark-accent text-foreground">
                          {item.leg}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="px-3 sm:px-6 pb-3 sm:pb-6 pt-1 border-t border-bpi-border dark:border-bpi-dark-accent bg-gray-50/70 dark:bg-bpi-dark-card/50 flex-shrink-0">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
