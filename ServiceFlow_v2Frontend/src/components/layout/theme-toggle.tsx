"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@frontend/components/ui/button";
import { cn } from "@shared/utils";

interface ThemeToggleProps {
  className?: string;
}

/** Standalone dark/light mode toggle. Extracted from Header so it can be placed anywhere. */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("w-8 h-8", className)}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
