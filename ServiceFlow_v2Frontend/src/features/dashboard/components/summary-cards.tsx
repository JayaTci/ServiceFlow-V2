import { ClipboardList, Clock, Zap, CheckCircle2, TrendingUp } from "lucide-react";
import type { DashboardStats } from "@shared/types";

interface SummaryCardsProps {
  stats: DashboardStats;
}

// Renders dashboard KPI cards from aggregate request stats.
export function SummaryCards({ stats }: SummaryCardsProps) {
  const cards = [
    {
      label: "Total Requests",
      value: stats.total,
      icon: ClipboardList,
      color: "text-primary",
      bg: "bg-primary/10",
      accent: "border-primary/20",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      accent: "border-amber-500/20",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: Zap,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      accent: "border-blue-500/20",
    },
    {
      label: "Resolved",
      value: stats.resolved,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      accent: "border-emerald-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`relative rounded-xl border bg-card p-5 overflow-hidden ${card.accent}`}
        >
          {/* Subtle top accent line */}
          <div className={`absolute inset-x-0 top-0 h-0.5 ${card.bg.replace("/10", "/40")}`} />

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {card.label}
              </p>
              <p className="text-3xl font-bold text-foreground tabular-nums">
                {card.value}
              </p>
            </div>
            <div className={`p-2.5 rounded-xl ${card.bg}`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
          </div>

          {stats.total > 0 && card.label !== "Total Requests" && (
            <div className="mt-3 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground/60">
                {Math.round((card.value / stats.total) * 100)}% of total
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
