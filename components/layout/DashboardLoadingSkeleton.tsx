"use client";

/**
 * DashboardLoadingSkeleton — single loading shield used by BOTH:
 *   1. Every route's `loading.tsx`  (Next.js RSC resolution phase)
 *   2. DashboardContent's own `isInitialLoading` gate (client query phase)
 *
 * Mirrors the real BPI dashboard layout exactly so the transition to real
 * content feels invisible. Uses a sweeping gradient shimmer (not pulse).
 */
export default function DashboardLoadingSkeleton({ label }: { label?: string }) {
  return (
    <>
      {/* Shimmer keyframe + utility injected once at the top of this component tree */}
      <style>{`
        .sk {
          background: linear-gradient(
            110deg,
            #dde3ea 0%,
            #dde3ea 20%,
            #edf0f3 38%,
            #f5f7f9 50%,
            #edf0f3 62%,
            #dde3ea 80%,
            #dde3ea 100%
          );
          background-size: 300% 100%;
          animation: bpi-shimmer 2s ease-in-out infinite;
        }
        .dark .sk {
          background: linear-gradient(
            110deg,
            #1a2435 0%,
            #1a2435 20%,
            #223048 38%,
            #2a3a5a 50%,
            #223048 62%,
            #1a2435 80%,
            #1a2435 100%
          );
          background-size: 300% 100%;
        }
        @keyframes bpi-shimmer {
          0%   { background-position: 150% 0; }
          100% { background-position: -150% 0; }
        }
      `}</style>

      <div className="flex min-h-screen flex-col bg-[#f2f5f8] dark:bg-[#0d1520]">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between
          border-b border-gray-200/80 dark:border-gray-800/80
          bg-white/90 dark:bg-[#111b28]/90 backdrop-blur-md px-4 sm:px-6 shadow-sm">

          {/* Logo + brand */}
          <div className="flex items-center gap-3">
            <div className="sk h-11 w-11 rounded-xl" />
            <div className="hidden md:flex flex-col gap-2">
              <div className="sk h-4 w-40 rounded-md" />
              <div className="sk h-3 w-28 rounded-md" />
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="sk hidden sm:block h-4 w-36 rounded-md" />
            <div className="sk h-8 w-20 rounded-lg" />   {/* Refresh */}
            <div className="sk h-8 w-16 rounded-lg" />   {/* Dark toggle */}
            {/* Notification bell */}
            <div className="sk h-9 w-9 rounded-full" />
            {/* User chip */}
            <div className="sk hidden md:block h-8 w-40 rounded-full" />
            <div className="sk h-8 w-20 rounded-lg" />   {/* Settings */}
            <div className="sk h-8 w-20 rounded-lg" />   {/* Sign Out */}
          </div>
        </header>

        {/* ── BODY ───────────────────────────────────────────────── */}
        <div className="flex flex-1 gap-0">

          {/* ── LEFT SIDEBAR ─────────────────────────────────────── */}
          <aside className="hidden lg:flex w-[260px] xl:w-[280px] flex-shrink-0 flex-col
            gap-3 overflow-y-auto border-r border-gray-200/80 dark:border-gray-800/80
            bg-white dark:bg-[#111b28] px-4 py-5">

            {/* — Nav links (above profile) — */}
            <div className="flex flex-col gap-1 mb-2">
              {[90, 60, 70, 80, 55, 75, 65, 80].map((w, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <div className="sk h-5 w-5 rounded-md flex-shrink-0" />
                  <div className="sk h-3.5 rounded-md flex-shrink-0" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>

            {/* — User Profile card — */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800
              bg-gray-50/80 dark:bg-[#182233] p-4 flex flex-col items-center gap-3">
              {/* Avatar */}
              <div className="sk h-20 w-20 rounded-full" />
              {/* Name + email */}
              <div className="sk h-4 w-32 rounded-md" />
              <div className="sk h-3 w-40 rounded-md" />
              {/* Profile status bar */}
              <div className="w-full flex flex-col gap-1">
                <div className="flex justify-between">
                  <div className="sk h-3 w-24 rounded-sm" />
                  <div className="sk h-3 w-8 rounded-sm" />
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div className="sk h-full w-3/4 rounded-full" />
                </div>
              </div>
            </div>

            {/* — Profile fields — */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800
              bg-white dark:bg-[#182233] px-4 py-4 flex flex-col gap-3">
              {[
                ['First Name', 55],
                ['Last Name', 48],
                ['Email', 70],
                ['Mobile', 52],
                ['ID', 80],
                ['Address', 60],
                ['Location', 65],
                ['Gender', 30],
              ].map(([, w], i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="sk h-4 w-4 rounded-sm flex-shrink-0" />
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="sk h-2.5 w-16 rounded-sm" />
                    <div className="sk h-3.5 rounded-sm" style={{ width: `${w}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* — Account Statistics — */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800
              bg-white dark:bg-[#182233] px-4 py-4">
              <div className="sk h-4 w-36 rounded-md mb-3" />
              <div className="sk h-3 w-28 rounded-sm mb-3" />
              {[70, 55, 60, 53, 65].map((w, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60 last:border-0">
                  <div className="sk h-3 rounded-sm" style={{ width: `${w}%` }} />
                  <div className="sk h-3 w-6 rounded-sm" />
                </div>
              ))}
              <div className="sk h-8 w-full rounded-lg mt-3" />
              <div className="flex items-center justify-between mt-2">
                <div className="sk h-2.5 w-28 rounded-sm" />
                <div className="sk h-2.5 w-8 rounded-sm" />
              </div>
            </div>

            {/* — Membership Status — */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800
              bg-white dark:bg-[#182233] px-4 py-4">
              <div className="sk h-4 w-36 rounded-md mb-3" />
              {['BPI Activation', 'Profile Status', 'Goidan Activation', 'Community Support', 'Email Verification', 'Referral Program'].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="sk h-3 w-3 rounded-full flex-shrink-0" />
                    <div className="sk h-3 rounded-sm" style={{ width: `${55 + (i * 9) % 30}px` }} />
                  </div>
                  <div className="sk h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>

            {/* — Referral Tools — */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800
              bg-white dark:bg-[#182233] px-4 py-4 flex flex-col gap-3">
              <div className="sk h-4 w-28 rounded-md" />
              {/* Auto-invite inputs */}
              <div className="sk h-9 w-full rounded-lg" />
              <div className="sk h-9 w-full rounded-lg" />
              <div className="sk h-9 w-full rounded-lg" />
              <div className="sk h-9 w-full rounded-lg" />
              {/* Share link */}
              <div className="sk h-4 w-24 rounded-md mt-1" />
              <div className="flex items-center gap-2">
                <div className="sk h-9 flex-1 rounded-lg" />
                <div className="sk h-9 w-9 rounded-lg flex-shrink-0" />
              </div>
            </div>
          </aside>

          {/* ── MAIN CONTENT ─────────────────────────────────────── */}
          <main className="flex-1 overflow-y-auto px-4 sm:px-5 lg:px-6 py-5 flex flex-col gap-4">

            {/* — Community Statistics header — */}
            <div className="flex items-center justify-between">
              <div className="sk h-5 w-48 rounded-lg" />
              <div className="flex gap-3">
                <div className="sk h-4 w-24 rounded-md" />
                <div className="sk h-4 w-32 rounded-md" />
              </div>
            </div>

            {/* — Top stats row (4 cards) — */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                ['Total Members', '0'],
                ['New Signups', '0'],
                ['Active Members', '0'],
                ['New This Month', '0'],
              ].map((_, i) => (
                <div key={i}
                  className="rounded-2xl border border-gray-100 dark:border-gray-800
                    bg-white dark:bg-[#111b28] p-4 shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="sk h-3.5 w-20 rounded-md" />
                    <div className="sk h-8 w-8 rounded-full" />
                  </div>
                  <div className="sk h-7 w-16 rounded-md" />
                  <div className="sk h-3 w-24 rounded-md" />
                </div>
              ))}
            </div>

            {/* — Community stats detail row — */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
              {/* Left 2-col grid (regions + referral growth + network) */}
              <div className="xl:col-span-2 rounded-2xl border border-gray-100 dark:border-gray-800
                bg-white dark:bg-[#111b28] p-5 shadow-sm flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Top regions */}
                  <div className="flex flex-col gap-2">
                    <div className="sk h-3.5 w-28 rounded-md mb-1" />
                    {[65, 50, 52, 40, 45].map((w, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="sk h-3 rounded-sm flex-1" style={{ width: `${w}%` }} />
                        <div className="sk h-3 w-6 rounded-sm" />
                      </div>
                    ))}
                  </div>
                  {/* Referral growth */}
                  <div className="flex flex-col gap-2">
                    <div className="sk h-3.5 w-28 rounded-md mb-1" />
                    <div className="sk h-24 w-full rounded-xl" />
                  </div>
                </div>
                {/* Flag signals + active row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="sk h-3.5 w-24 rounded-md" />
                    <div className="sk h-3 w-16 rounded-sm" />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="sk h-5 w-8 rounded-sm" />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="sk h-3.5 w-28 rounded-md" />
                    <div className="sk h-16 w-full rounded-xl" />
                  </div>
                </div>
              </div>

              {/* Right side stats */}
              <div className="flex flex-col gap-3">
                {/* Leader distribution */}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800
                  bg-white dark:bg-[#111b28] p-4 shadow-sm flex flex-col gap-2">
                  <div className="sk h-3.5 w-32 rounded-md" />
                  {[100, 80, 60, 40].map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="sk h-2.5 rounded-sm flex-1" style={{ width: `${w}%` }} />
                      <div className="sk h-2.5 w-6 rounded-sm flex-shrink-0" />
                    </div>
                  ))}
                </div>
                {/* Network channels */}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800
                  bg-white dark:bg-[#111b28] p-4 shadow-sm flex flex-col gap-2">
                  <div className="sk h-3.5 w-32 rounded-md" />
                  {[['UK', 60], ['Nigeria', 100], ['Ghana', 40]].map(([, w], i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="sk h-3 w-3 rounded-full flex-shrink-0" />
                      <div className="sk h-2.5 rounded-sm flex-1" style={{ width: `${w}%` }} />
                    </div>
                  ))}
                </div>
                {/* Growth Trend */}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800
                  bg-white dark:bg-[#111b28] p-4 shadow-sm">
                  <div className="sk h-3.5 w-24 rounded-md mb-3" />
                  <div className="sk h-20 w-full rounded-xl" />
                </div>
              </div>
            </div>

            {/* — Third-Party Opportunities — */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800
              bg-white dark:bg-[#111b28] p-5 shadow-sm">
              <div className="sk h-4 w-44 rounded-md mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1,2,3].map(i => (
                  <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800
                    bg-gray-50 dark:bg-[#182233] p-4 flex flex-col gap-2">
                    <div className="sk h-10 w-10 rounded-xl mb-1" />
                    <div className="sk h-4 w-36 rounded-md" />
                    <div className="sk h-3 w-full rounded-sm" />
                    <div className="sk h-3 w-4/5 rounded-sm" />
                    <div className="sk h-8 w-24 rounded-lg mt-1" />
                  </div>
                ))}
              </div>
            </div>

            {/* — Blog section — */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800
              bg-white dark:bg-[#111b28] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col gap-2">
                  <div className="sk h-3 w-28 rounded-sm" />
                  <div className="flex items-center gap-2">
                    <div className="sk h-5 w-44 rounded-md" />
                    <div className="sk h-5 w-16 rounded-full" />
                  </div>
                </div>
                <div className="sk h-8 w-24 rounded-lg" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1,2,3].map(i => (
                  <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800
                    bg-gray-50 dark:bg-[#182233] overflow-hidden">
                    <div className="sk h-36 w-full" />
                    <div className="p-3 flex flex-col gap-2">
                      <div className="sk h-4 w-full rounded-md" />
                      <div className="sk h-3 w-4/5 rounded-sm" />
                      <div className="sk h-3 w-16 rounded-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional page label */}
            {label && (
              <div className="flex justify-center pb-4">
                <p className="text-xs font-medium text-gray-400/70 dark:text-gray-600/70 animate-pulse tracking-wider uppercase">
                  {label}
                </p>
              </div>
            )}
          </main>
        </div>

        {/* ── MOBILE BOTTOM NAV ──────────────────────────────────── */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center
          justify-around border-t border-gray-200 dark:border-gray-800
          bg-white/95 dark:bg-[#111b28]/95 backdrop-blur-md px-2 lg:hidden">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="sk h-5 w-5 rounded-md" />
              <div className="sk h-2 w-9 rounded-sm" />
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
