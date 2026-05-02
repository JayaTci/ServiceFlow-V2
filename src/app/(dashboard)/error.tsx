"use client";

import { useEffect } from "react";
import { Button } from "@frontend/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Intentional: surfaces errors in Vercel logs and browser devtools.
    // Replace with Sentry.captureException(error) or similar for production monitoring.
    console.error("[DashboardError]", error.message, error.digest ?? "");
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-60 gap-4">
      <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">{error.message || "An unexpected error occurred"}</p>
      <Button onClick={reset} variant="outline">Try again</Button>
    </div>
  );
}
