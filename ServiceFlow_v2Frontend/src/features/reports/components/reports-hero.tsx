"use client";

import { motion } from "framer-motion";
import { ClipboardList, Clock, Zap, CheckCircle2 } from "lucide-react";
import type { DashboardStats } from "@shared/types";

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const card = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

interface ReportsHeroProps {
  stats: DashboardStats;
}

/** Animated stat row used at the top of the Reports page. */
export function ReportsHero({ stats }: ReportsHeroProps) {
  const cards = [
    {
      label: "Total",
      value: stats.total,
      icon: ClipboardList,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
      border: "border-emerald-500/25",
      topGrad: "from-emerald-500 to-teal-400",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-500/10",
      border: "border-amber-500/25",
      topGrad: "from-amber-500 to-orange-400",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: Zap,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10",
      border: "border-blue-500/25",
      topGrad: "from-blue-500 to-violet-500",
    },
    {
      label: "Resolved",
      value: stats.resolved,
      icon: CheckCircle2,
      iconColor: "text-teal-500",
      iconBg: "bg-teal-500/10",
      border: "border-teal-500/25",
      topGrad: "from-teal-500 to-emerald-400",
    },
  ];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-4 gap-4"
    >
      {cards.map((c) => (
        <motion.div
          key={c.label}
          variants={card}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className={`relative rounded-xl border bg-card overflow-hidden cursor-default ${c.border}`}
        >
          <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${c.topGrad}`} />
          <div className="p-5 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${c.iconBg} shrink-0`}>
              <c.icon className={`w-4 h-4 ${c.iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground tabular-nums leading-none">
                {c.value}
              </p>
              <p className="text-[11px] font-medium text-muted-foreground mt-1">{c.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
