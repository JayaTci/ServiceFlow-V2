"use client";

import { motion } from "framer-motion";
import { ClipboardList, Clock, Zap, CheckCircle2 } from "lucide-react";
import type { DashboardStats } from "@shared/types";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const card = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const BAR_COLORS: Record<string, string> = {
  Pending:       "from-amber-500 to-orange-400",
  "In Progress": "from-blue-500 to-violet-500",
  Resolved:      "from-teal-500 to-emerald-400",
};

interface SummaryCardsProps {
  stats: DashboardStats;
}

/** Animated KPI stat cards with progress bars and hover lift effects. */
export function SummaryCards({ stats }: SummaryCardsProps) {
  const cards = [
    {
      label: "Total Requests",
      value: stats.total,
      icon: ClipboardList,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
      border: "border-emerald-500/25",
      topGrad: "from-emerald-500 to-teal-400",
      glowColor: "shadow-emerald-500/10",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-500/10",
      border: "border-amber-500/25",
      topGrad: "from-amber-500 to-orange-400",
      glowColor: "shadow-amber-500/10",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: Zap,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10",
      border: "border-blue-500/25",
      topGrad: "from-blue-500 to-violet-500",
      glowColor: "shadow-blue-500/10",
    },
    {
      label: "Resolved",
      value: stats.resolved,
      icon: CheckCircle2,
      iconColor: "text-teal-500",
      iconBg: "bg-teal-500/10",
      border: "border-teal-500/25",
      topGrad: "from-teal-500 to-emerald-400",
      glowColor: "shadow-teal-500/10",
    },
  ];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cards.map((c) => {
        const pct = stats.total > 0 && c.label !== "Total Requests"
          ? Math.round((c.value / stats.total) * 100)
          : null;

        return (
          <motion.div
            key={c.label}
            variants={card}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className={`group relative rounded-xl border bg-card p-5 overflow-hidden cursor-default shadow-lg ${c.border} ${c.glowColor} hover:shadow-xl transition-shadow duration-300`}
          >
            {/* Top gradient accent bar */}
            <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${c.topGrad}`} />

            {/* Hover bg glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                  {c.label}
                </p>
                <p className="text-3xl font-bold text-foreground tabular-nums leading-none">
                  {c.value}
                </p>
              </div>
              <div
                className={`p-2.5 rounded-xl ${c.iconBg} ring-1 ring-inset ${c.border} group-hover:scale-110 transition-transform duration-300`}
              >
                <c.icon className={`w-5 h-5 ${c.iconColor}`} />
              </div>
            </div>

            {pct !== null ? (
              <div className="relative mt-4 space-y-1">
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full rounded-full bg-gradient-to-r ${BAR_COLORS[c.label] ?? c.topGrad}`}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground/60 font-medium">
                  {pct}% of total
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-[11px] text-muted-foreground/50">All-time requests</p>
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
