"use client";
import { Shield, User, Home, Users, Bell } from "lucide-react";

interface MembershipStatusCardProps {
  userProfile: any;
  profileComplete: boolean;
  onVerifyEmail?: () => void;
}

export function MembershipStatusCard({ userProfile, profileComplete, onVerifyEmail }: MembershipStatusCardProps) {
  const ud = userProfile as any;
  const hasMembership = !!ud?.activeMembership;
  const isShelterActive = ud?.isShelter === 1 || ud?.palliativeActivated || ["gold", "platinum"].some(t => ud?.activeMembership?.name?.toLowerCase().includes(t));
  const isCommunityEligible = hasMembership && profileComplete;
  const isEmailVerified = !!ud?.emailVerified;

  const items = [
    { icon: Shield, label: "BPI Activation", active: hasMembership, activeText: "Active", inactiveText: "Inactive" },
    { icon: User, label: "Profile Status", active: profileComplete, activeText: "Complete", inactiveText: "Incomplete" },
    { icon: Home, label: "Shelter Activation", active: isShelterActive, activeText: "Active", inactiveText: "Inactive" },
    { icon: Users, label: "Community Support", active: isCommunityEligible, activeText: "Eligible", inactiveText: "Not Eligible" },
    { icon: Bell, label: "Email Verification", active: isEmailVerified, activeText: "Verified", inactiveText: "Pending", onClick: !isEmailVerified ? onVerifyEmail : undefined },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-emerald-800/40 bg-white dark:bg-slate-900/50 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Membership Status</h2>
      </div>
      <div className="p-4 space-y-2.5">
        {items.map((item) => (
          <div
            key={item.label}
            onClick={item.onClick}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              item.active
                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            } ${item.onClick ? "cursor-pointer hover:opacity-80" : ""}`}
          >
            <div className="flex items-center gap-2">
              <item.icon className={`w-4 h-4 ${item.active ? "text-emerald-500 animate-pulse" : "text-red-500"}`} />
              <span className={`text-xs font-medium ${item.active ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>{item.label}</span>
            </div>
            <span className={`px-2 py-1 text-[10px] font-semibold rounded-full ${
              item.active
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}>
              {item.active ? item.activeText : item.inactiveText}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
