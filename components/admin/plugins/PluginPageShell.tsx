"use client";

import { motion } from "framer-motion";

export default function PluginPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full min-w-0 rounded-2xl border border-border bg-card/70 p-5 shadow-lg shadow-black/5 backdrop-blur-sm dark:shadow-black/20"
    >
      <div className="mb-4 border-b border-border pb-3">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </motion.section>
  );
}
