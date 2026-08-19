"use client";
import { AlertTriangle, Clock, User, Mail, Check, Bell } from "lucide-react";

interface SmartAlertsProps {
  walletHealth: any;
  dashboardData: any;
  profileComplete: boolean;
  emailVerified: boolean;
  onVerifyEmail?: () => void;
}

export function SmartAlerts({ walletHealth, dashboardData, profileComplete, emailVerified, onVerifyEmail }: SmartAlertsProps) {
  const alerts: { icon: any; color: string; bg: string; border: string; title: string; message: string; onClick?: () => void }[] = [];

  if (walletHealth?.warnings?.length > 0) {
    walletHealth.warnings.forEach((w: string) => {
      alerts.push({ icon: AlertTriangle, color: "text-yellow-600 dark:text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-200 dark:border-yellow-800", title: "Wallet Warning", message: w });
    });
  }

  const upcoming = dashboardData?.packages?.stats?.upcomingMaturities;
  if (upcoming && upcoming > 0) {
    alerts.push({ icon: Clock, color: "text-orange-600 dark:text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800", title: "Package Maturing Soon", message: `${upcoming} package${upcoming > 1 ? "s" : ""} will mature within 7 days. Plan your reinvestment strategy.` });
  }

  if (!profileComplete) {
    alerts.push({ icon: User, color: "text-red-600 dark:text-red-500", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800", title: "Complete Your Profile", message: "Your profile is incomplete. Complete it to unlock all dashboard features." });
  }

  if (!emailVerified) {
    alerts.push({ icon: Mail, color: "text-red-600 dark:text-red-500", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800", title: "Verify Your Email", message: "Please verify your email address to receive important notifications.", onClick: onVerifyEmail });
  }

  const allGood = alerts.length === 0;

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-emerald-800/40 bg-white dark:bg-slate-900/50 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10">
      <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/15 to-emerald-400/10 flex items-center justify-center ring-1 ring-amber-300/20">
            <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Smart Alerts</h2>
        </div>
        {alerts.length > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">{alerts.length}</span>}
      </div>
      <div className="p-4 space-y-3">
        {allGood ? (
          <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">All Systems Normal</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">Your account is in good standing. No urgent actions required.</p>
            </div>
          </div>
        ) : alerts.map((a, i) => (
          <div key={i} onClick={a.onClick} className={`flex items-start gap-3 p-3 ${a.bg} border ${a.border} rounded-lg ${a.onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}>
            <a.icon className={`w-5 h-5 ${a.color} flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{a.title}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{a.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
