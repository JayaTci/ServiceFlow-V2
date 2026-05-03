"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@shared/utils";

interface AnimatedChartPanelProps {
  title: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  headerChildren?: React.ReactNode;
}

/** Framer Motion-wrapped card panel for charts and data sections. */
export function AnimatedChartPanel({
  title,
  children,
  delay = 0,
  className,
  viewAllHref,
  viewAllLabel = "View all",
  headerChildren,
}: AnimatedChartPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn("rounded-xl border border-border bg-card overflow-hidden", className)}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            {viewAllLabel}
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
        {headerChildren}
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

/** Variant without a header border — just a padded panel. */
export function AnimatedPanel({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn("rounded-xl border border-border bg-card p-5", className)}
    >
      {children}
    </motion.div>
  );
}
