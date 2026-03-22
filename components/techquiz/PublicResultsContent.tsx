"use client";

import { motion } from "framer-motion";
import { api } from "@/client/trpc";
import { Trophy, Medal, Award, Star, MapPin, School, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

const rankMeta = (rank: number) => {
  if (rank === 1) return { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800", label: "1st Place" };
  if (rank === 2) return { icon: Medal, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700", label: "2nd Place" };
  if (rank === 3) return { icon: Medal, color: "text-amber-700", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800", label: "3rd Place" };
  if (rank <= 10) return { icon: Award, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800", label: `${rank}th Place` };
  return { icon: Star, color: "text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800", label: `${rank}th Place` };
};

function BracketBadge({ bracket }: { bracket: string | null }) {
  if (!bracket) return null;
  const colors: Record<string, string> = {
    Major: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    Merit: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    Consolation: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  };
  const clazz = colors[bracket] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${clazz}`}>
      {bracket} Prize
    </span>
  );
}

export default function PublicResultsContent({ eventId }: { eventId: string }) {
  const { data, isLoading, error } = api.techquiz.getPublicResults.useQuery({ eventId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16 text-slate-400 dark:text-slate-500">
        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>Results not found or not yet published.</p>
        <Link href="/techquiz" className="mt-4 inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-semibold">
          <ArrowLeft size={13} /> Back to TechQuiz
        </Link>
      </div>
    );
  }

  const { event, top20 } = data;

  // Separate podium (1–3) and rest
  const podium = top20.filter((r) => r.finalRank !== null && r.finalRank <= 3);
  const rest = top20.filter((r) => r.finalRank !== null && r.finalRank! > 3);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Back link */}
      <Link href="/techquiz" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition">
        <ArrowLeft size={13} /> All Events
      </Link>

      {/* Event banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative">
          <div className="flex items-center gap-2 text-emerald-200 text-sm mb-3">
            <Trophy size={14} /> BPI TechQuiz Competition
          </div>
          <h1 className="text-3xl font-black mb-2">{event.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-emerald-100">
            <span className="flex items-center gap-1.5"><MapPin size={13} /> {event.state}</span>
            {event.completedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar size={13} /> {new Date(event.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            )}
            <span className="flex items-center gap-1.5"><Award size={13} /> {top20.length} winners</span>
          </div>
        </div>
      </div>

      {/* Podium — top 3 */}
      {podium.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Top Podium</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[2, 1, 3].map((rank) => {
              const result = podium.find((r) => r.finalRank === rank);
              if (!result) return null;
              const meta = rankMeta(rank);
              const Icon = meta.icon;
              return (
                <motion.div
                  key={rank}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: rank === 1 ? -8 : 0 }}
                  transition={{ delay: (3 - rank) * 0.1 }}
                  className={`rounded-2xl border p-5 text-center ${meta.bg} ${rank === 1 ? "ring-2 ring-yellow-400/60 shadow-lg" : ""}`}
                >
                  <Icon size={28} className={`${meta.color} mx-auto mb-2`} />
                  <div className="font-black text-slate-900 dark:text-white text-base leading-tight">
                    {result.childBeneficiary?.childName ?? "—"}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <School size={11} />
                    {result.application?.school?.name ?? "—"}
                  </div>
                  <div className="mt-3">
                    <BracketBadge bracket={result.awardBracket} />
                  </div>
                  {result.finalScore != null && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Score: <strong className="text-slate-700 dark:text-slate-200">{Number(result.finalScore).toFixed(1)}</strong>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full leaderboard 4–20 */}
      {rest.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Full Results — Top 20</h2>
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {rest.map((result, i) => {
                const rank = result.finalRank!;
                const meta = rankMeta(rank);
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-200 flex-shrink-0">
                      {rank}
                    </div>
                    <Icon size={14} className={`${meta.color} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">
                        {result.childBeneficiary?.childName ?? "—"}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 truncate">
                        <School size={10} />
                        {result.application?.school?.name ?? "—"} · {result.application?.school?.state ?? ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <BracketBadge bracket={result.awardBracket} />
                      {result.finalScore != null && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {Number(result.finalScore).toFixed(1)} pts
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {top20.length === 0 && (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Final results not yet published for this event.</p>
        </div>
      )}
    </div>
  );
}
