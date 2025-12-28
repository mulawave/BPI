"use client";

import { Card } from "./ui/card";
import { BarChart3, Users, Wallet, TrendingUp } from "lucide-react";

/**
 * Dashboard Preview/Skeleton
 * Shows a blurred preview of what the dashboard will look like
 * Used when profile is incomplete
 */
export default function DashboardPreview() {
  return (
    <div className="relative pointer-events-none select-none">
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 z-10" />
      
      <div className="relative z-0 opacity-40">
        <div className="max-w-[95vw] mx-auto px-4 py-8 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Wallet, label: "Total Balance", value: "₦***,***" },
              { icon: Users, label: "Referrals", value: "**" },
              { icon: TrendingUp, label: "Earnings", value: "₦***,***" },
              { icon: BarChart3, label: "Activity", value: "**%" },
            ].map((stat, idx) => (
              <Card key={idx} className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-bpi-primary/20 to-bpi-secondary/20 rounded-lg">
                    <stat.icon className="w-6 h-6 text-bpi-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Wallet Cards */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">My Wallets</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Array(4).fill(0).map((_, idx) => (
                    <div key={idx} className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Wallet {idx + 1}</p>
                      <p className="text-xl font-bold">₦***,***</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-10 h-10 bg-bpi-primary/20 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-muted-foreground/10 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {Array(4).fill(0).map((_, idx) => (
                    <div key={idx} className="p-3 bg-muted rounded-lg">
                      <div className="h-4 bg-muted-foreground/20 rounded w-full" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Referral Stats */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Referral Network</h3>
                <div className="space-y-3">
                  {['Level 1', 'Level 2', 'Level 3', 'Level 4'].map((level, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{level}</span>
                      <span className="font-semibold">** members</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
