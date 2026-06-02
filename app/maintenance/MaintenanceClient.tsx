"use client";

import { useEffect, useRef, useState } from "react";

// ── types ──────────────────────────────────────────────────────────────────
interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

// ── helpers ────────────────────────────────────────────────────────────────
function calcTimeLeft(targetMs: number): TimeLeft {
  const total = Math.max(0, targetMs - Date.now());
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor(total / 1000 / 60 / 60);
  return { hours, minutes, seconds, total };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// ── sub-components ─────────────────────────────────────────────────────────
function CountUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {/* Card */}
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <span className="text-3xl md:text-4xl font-black text-white tabular-nums tracking-tight">
            {pad(value)}
          </span>
        </div>
        {/* bottom-edge accent */}
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
      </div>
      <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white/30">
        {label}
      </span>
    </div>
  );
}

// animated particle dots (purely decorative)
function Particles() {
  const count = 18;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const size = 2 + (i % 3);
        const left = (i * 5.7 + 3) % 97;
        const delay = (i * 0.31) % 4;
        const dur = 6 + (i % 5);
        return (
          <span
            key={i}
            className="absolute rounded-full bg-emerald-400/20 animate-pulse"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              top: `${(i * 7.3 + 5) % 90}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
            }}
          />
        );
      })}
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────
export default function MaintenanceClient({ targetMs }: { targetMs: number }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft(targetMs));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(calcTimeLeft(targetMs));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [targetMs]);

  // progress 0→100 as time elapses from "2h window" down to 0
  const windowMs = targetMs - (targetMs - 2 * 60 * 60 * 1000); // always 2h window base
  const elapsed = windowMs - timeLeft.total;
  const progress = Math.min(100, Math.max(0, Math.round((elapsed / windowMs) * 100)));
  const isDone = timeLeft.total === 0;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#020f07] px-4">
      {/* ── layered background glows ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-emerald-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-full bg-yellow-400/5 blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full bg-emerald-900/20 blur-[80px]" />
      </div>

      {/* decorative particles */}
      <Particles />

      {/* top accent line */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" aria-hidden />

      {/* ── card ── */}
      <div className="relative z-10 w-full max-w-xl mx-auto">
        {/* logo + wordmark */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-emerald-900/40 ring-1 ring-white/10">
            <img src="/img/logo.png" alt="BPI logo" className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/60 mb-0.5">
              BeepAgro Africa
            </p>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Palliative Initiative
            </h1>
          </div>
        </div>

        {/* status badge */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-400/10 border border-yellow-400/25 px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-yellow-300">
            {/* animated pulse dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
            </span>
            {isDone ? "Almost ready" : "Upgrade in progress"}
          </span>
        </div>

        {/* headline */}
        <div className="text-center mb-10 space-y-3">
          <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.1]">
            We&apos;ll Be Back
            <br />
            <span className="bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-500 bg-clip-text text-transparent">
              Shortly
            </span>
          </h2>
          <p className="text-white/40 text-base max-w-sm mx-auto leading-relaxed">
            We&apos;re upgrading the platform to bring you a better experience.
            Everything will be ready soon.
          </p>
        </div>

        {/* ── countdown ── */}
        {!isDone ? (
          <div className="flex items-center justify-center gap-4 md:gap-6 mb-10">
            <CountUnit value={timeLeft.hours} label="Hours" />
            <div className="mb-6 text-white/20 text-3xl font-black select-none">:</div>
            <CountUnit value={timeLeft.minutes} label="Minutes" />
            <div className="mb-6 text-white/20 text-3xl font-black select-none">:</div>
            <CountUnit value={timeLeft.seconds} label="Seconds" />
          </div>
        ) : (
          <div className="text-center mb-10">
            <span className="text-emerald-400 font-black text-xl">
              Finishing up — refresh in a moment…
            </span>
          </div>
        )}

        {/* ── animated progress bar ── */}
        <div className="mb-10 space-y-2">
          <div className="flex justify-between text-[11px] font-semibold text-white/25 uppercase tracking-widest">
            <span>Upgrade progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-green-400 to-yellow-400 transition-all duration-1000 ease-linear shadow-[0_0_12px_rgba(52,211,153,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* shimmer overlay */}
          <div className="relative h-2 w-full rounded-full -mt-2 overflow-hidden pointer-events-none">
            <div
              className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_linear_infinite]"
              style={{ left: `-6rem` }}
            />
          </div>
        </div>

        {/* feature checklist */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          {[
            { label: "Database optimisation", done: true },
            { label: "Security hardening", done: true },
            { label: "Performance tuning", done: progress > 40 },
            { label: "Final deployment", done: isDone },
          ].map(({ label, done }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3"
            >
              <span
                className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition-colors duration-700 ${
                  done
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-white/5 text-white/15"
                }`}
              >
                {done ? "✓" : "·"}
              </span>
              <span
                className={`text-xs font-semibold transition-colors duration-700 ${
                  done ? "text-white/60" : "text-white/20"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* footer note */}
        <p className="text-center text-[11px] text-white/15 leading-relaxed">
          Need urgent assistance?{" "}
          <a
            href="mailto:support@beepagro.com"
            className="text-emerald-400/50 hover:text-emerald-400 underline underline-offset-2 transition-colors"
          >
            Contact support
          </a>
        </p>
      </div>

      {/* shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(0); }
          100% { transform: translateX(calc(100vw + 6rem)); }
        }
      `}</style>
    </div>
  );
}
