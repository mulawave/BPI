"use client";

import { motion } from "framer-motion";
import FinancialCommandCenter from "@/components/admin/FinancialCommandCenter";

export default function AdminFinancialsPage() {
  return (
    <div className="min-h-screen space-y-6 pb-12">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-[hsl(var(--muted))] to-card p-6 shadow-xl backdrop-blur-sm"
      >
        <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--primary))] opacity-10 blur-2xl" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Financial Accounting & Audit</h1>
            <p className="text-sm text-muted-foreground">Production-grade ledger intelligence, queue control, and source-to-destination financial traceability.</p>
          </div>
          <a href="/admin" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">Back to Dashboard</a>
        </div>
      </motion.div>

      <FinancialCommandCenter />
    </div>
  );
}
