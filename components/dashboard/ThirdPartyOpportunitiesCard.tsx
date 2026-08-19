"use client";
import { Share2, AlertCircle, Target, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThirdPartyOpportunitiesCardProps {
  summary: any;
  availablePlatforms: any;
  onOpenModal?: () => void;
  onOpenMatrix?: () => void;
}

export function ThirdPartyOpportunitiesCard({ summary, availablePlatforms, onOpenModal, onOpenMatrix }: ThirdPartyOpportunitiesCardProps) {
  const s = summary as any;
  const hasPlatforms = s && s.totalPlatforms > 0;
  const hasAvailable = availablePlatforms && availablePlatforms.length > 0;

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-emerald-800/40 bg-gradient-to-br from-white to-amber-50/20 dark:from-slate-900 dark:to-slate-950/30 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10 flex flex-col">
      <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/15 to-emerald-400/10 flex items-center justify-center ring-1 ring-amber-300/20">
            <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Third-Party Opportunities</h2>
        </div>
        {s && s.pendingPlatforms > 0 && (
          <span className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full">{s.pendingPlatforms} Pending</span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Team Growth Platforms</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Grow your network across multiple platforms together</p>
        </div>

        {s ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Completed</div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{s.completedPlatforms}/{s.totalPlatforms}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Team Registered</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{s.totalRegistrations}/{s.totalDirectDownlines}</div>
              </div>
            </div>

            {s.pendingPlatforms > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-orange-700 dark:text-orange-300">
                    {s.pendingPlatforms} platform{s.pendingPlatforms > 1 ? "s" : ""} awaiting your registration
                  </span>
                </div>
              </div>
            )}

            {!hasAvailable ? (
              <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-800">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">No opportunities available</p>
                <p className="text-xs text-slate-400">Your upline hasn't shared any platform links yet</p>
              </div>
            ) : (
              <Button onClick={onOpenModal} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                <Share2 className="w-4 h-4 mr-2" />
                Manage Opportunities
              </Button>
            )}

            <Button onClick={onOpenMatrix} variant="outline" className="w-full border-emerald-300/70 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700/70 dark:text-emerald-300 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-200">
              <GitBranch className="w-4 h-4 mr-2" />
              Open Matrix Console
            </Button>
          </>
        ) : (
          <div className="space-y-3 flex-1 flex flex-col justify-end">
            <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">No platforms available</p>
              <p className="text-xs text-slate-400">Check back later for team growth opportunities</p>
            </div>
            <Button onClick={onOpenMatrix} variant="outline" className="w-full border-emerald-300/70 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700/70 dark:text-emerald-300 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-200">
              <GitBranch className="w-4 h-4 mr-2" />
              Open Matrix Console
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
