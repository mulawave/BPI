"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, Wallet, Store, Shield, Users, Newspaper,
  Calculator, ChevronRight, BookOpen, ArrowRight, Sparkles,
  TrendingUp, Lock, Crown, LifeBuoy, Loader2,
} from "lucide-react";

const premiumCardClass = "rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10";

type LearningModule = {
  id: string;
  title: string;
  description: string;
  icon: typeof Wallet;
  color: string;
  lessons: { title: string; description: string; href: string }[];
};

const MODULES: LearningModule[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Learn the basics of BPI — account setup, navigation, and your dashboard.",
    icon: Sparkles,
    color: "text-emerald-500",
    lessons: [
      { title: "Account Registration", description: "How to create and verify your BPI account.", href: "/help/account-registration" },
      { title: "Dashboard Overview", description: "Understanding your Total Portfolio Value, wallets, and stats.", href: "/dashboard" },
      { title: "Profile & Settings", description: "Managing your profile, password, and security settings.", href: "/settings" },
    ],
  },
  {
    id: "wallet-management",
    title: "Wallet Management",
    description: "Master deposits, withdrawals, transfers, and Auto-Debit settings.",
    icon: Wallet,
    color: "text-amber-500",
    lessons: [
      { title: "Depositing Funds", description: "Step-by-step guide to funding your wallet via multiple gateways.", href: "/help/depositing-funds" },
      { title: "Withdrawing Funds", description: "How to withdraw via bank transfer or USDT.", href: "/help/withdrawing-funds" },
      { title: "Transferring Between Users", description: "Send funds to other BPI users instantly.", href: "/help/transferring-funds" },
      { title: "Auto-Debit Settings", description: "Configure automatic deductions and scheduled payments.", href: "/wallet/settings" },
    ],
  },
  {
    id: "store-guide",
    title: "BPI Superstore",
    description: "Browse products, checkout with fiat or crypto, and manage orders.",
    icon: Store,
    color: "text-blue-500",
    lessons: [
      { title: "Browsing the Store", description: "Find products, filter by category, and view details.", href: "/store" },
      { title: "Checkout Process", description: "Pay with fiat, crypto, or hybrid checkout.", href: "/help/checkout-process" },
      { title: "Order Tracking", description: "Track your orders and view order history.", href: "/store/orders" },
      { title: "Claim Code & Pickup", description: "Use claim codes to verify pickup at designated centers.", href: "/store/pickup-verify" },
    ],
  },
  {
    id: "kyc-verification",
    title: "KYC Verification",
    description: "Complete identity verification to unlock full platform access.",
    icon: Shield,
    color: "text-red-500",
    lessons: [
      { title: "KYC Overview", description: "What KYC is and why it's required.", href: "/help/kyc-overview" },
      { title: "Document Requirements", description: "Accepted IDs and document upload guide.", href: "/help/kyc-documents" },
      { title: "Start Verification", description: "Begin your KYC verification process.", href: "/kyc" },
    ],
  },
  {
    id: "membership",
    title: "Membership & Elite Club",
    description: "Upgrade your membership tier for exclusive benefits and higher earning potential.",
    icon: Crown,
    color: "text-purple-500",
    lessons: [
      { title: "Membership Tiers", description: "Understand the different membership levels and benefits.", href: "/help/membership-tiers" },
      { title: "Upgrade Your Membership", description: "How to upgrade to a higher tier.", href: "/elite-club" },
      { title: "BPI Token (BPT)", description: "Learn about the platform's native token and its uses.", href: "/help/bpi-token" },
    ],
  },
  {
    id: "community",
    title: "Community & CSP",
    description: "Community Support Program, referrals, and empowerment initiatives.",
    icon: Users,
    color: "text-teal-500",
    lessons: [
      { title: "CSP Overview", description: "Understanding the Community Support Program.", href: "/csp" },
      { title: "Referral Program", description: "Invite others and track your downline.", href: "/help/referral-program" },
      { title: "Empowerment Initiatives", description: "Explore empowerment programs for personal growth.", href: "/empowerment" },
    ],
  },
  {
    id: "techquiz",
    title: "TechQuiz & CBT",
    description: "Computer-based testing and quiz competitions for schools and individuals.",
    icon: BookOpen,
    color: "text-indigo-500",
    lessons: [
      { title: "TechQuiz Overview", description: "What TechQuiz is and how it works.", href: "/techquiz" },
      { title: "School Administration", description: "How schools can administer exams.", href: "/techquiz/school" },
      { title: "CBT Exams", description: "Take computer-based tests.", href: "/techquiz/cbt" },
    ],
  },
  {
    id: "blog-news",
    title: "Blog & News",
    description: "Stay updated with articles, news, and platform announcements.",
    icon: Newspaper,
    color: "text-orange-500",
    lessons: [
      { title: "Browse the Blog", description: "Read articles and news posts.", href: "/blog" },
      { title: "Platform Updates", description: "Latest updates and announcements.", href: "/help/platform-updates" },
    ],
  },
];

export default function LearningCenter() {
  const [expandedModule, setExpandedModule] = useState<string | null>("getting-started");

  return (
    <div className="space-y-8 px-4 md:px-10 lg:px-16 py-6">
      {/* Hero Banner */}
      <div className="rounded-3xl border border-amber-300/20 bg-gradient-to-br from-[#04231a] via-[#0a3d2b] to-[#062818] bg-[radial-gradient(ellipse_at_top_left,rgba(255,215,140,0.10),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.18),transparent_55%)] text-white p-6 shadow-2xl ring-1 ring-amber-300/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              <GraduationCap className="h-4 w-4" /> Learning Center
            </div>
            <h1 className="mt-3 text-3xl font-bold">Learn & Grow with BPI</h1>
            <p className="text-sm text-white/80 max-w-3xl">
              Structured guides and tutorials to help you master every feature of the platform — from wallet management to the Superstore, CSP, and beyond.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs">
            <div className="font-semibold">Quick tip</div>
            <div className="text-white/80">Start with "Getting Started" if you're new to BPI.</div>
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {MODULES.map((module) => {
          const Icon = module.icon;
          const isExpanded = expandedModule === module.id;

          return (
            <Card key={module.id} className={cn(premiumCardClass, "p-5")}>
              <button
                onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                className="w-full flex items-center gap-3 text-left"
              >
                <div className={cn("w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0", module.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{module.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{module.description}</p>
                </div>
                <ChevronRight className={cn("w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform flex-shrink-0", isExpanded && "rotate-90")} />
              </button>

              {isExpanded && (
                <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  {module.lessons.map((lesson) => (
                    <Link
                      key={lesson.title}
                      href={lesson.href}
                      className="block rounded-xl border border-amber-300/20 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 px-4 py-3 hover:border-emerald-500/50 hover:shadow-md transition ring-1 ring-amber-300/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{lesson.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{lesson.description}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <Card className={cn(premiumCardClass, "p-5")}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <LifeBuoy className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Need more help?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Visit the Help Center or ask RAVEN for instant assistance.</p>
            </div>
          </div>
          <Link href="/help">
            <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20">
              Go to Help Center <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
