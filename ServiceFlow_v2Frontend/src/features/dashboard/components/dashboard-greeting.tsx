"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { buttonVariants } from "@frontend/components/ui/button";
import { cn } from "@shared/utils";

interface DashboardGreetingProps {
  name: string;
}

/** Animated page greeting with gradient name text and action button. */
export function DashboardGreeting({ name }: DashboardGreetingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="flex items-center justify-between"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Welcome back,{" "}
          <span
            className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent"
            style={{ WebkitBackgroundClip: "text" }}
          >
            {name}
          </span>
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here&apos;s what&apos;s happening with your requests today.
        </p>
      </div>

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
        <Link
          href="/requests/new"
          className={cn(
            buttonVariants({ size: "sm" }),
            "gap-1.5 shadow-lg shadow-primary/20"
          )}
        >
          <Plus className="w-4 h-4" />
          New Request
        </Link>
      </motion.div>
    </motion.div>
  );
}
