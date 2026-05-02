"use client";

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback UI. Defaults to a generic error message with a retry button. */
  fallback?: React.ReactNode;
}

/**
 * Catches render errors in the React component tree and shows a fallback UI instead of crashing the app.
 * Wrap feature roots or the main layout with this to prevent blank screens on unexpected errors.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 p-6 text-center">
          <p className="text-sm font-medium text-destructive">Something went wrong.</p>
          <button
            className="text-xs text-muted-foreground underline underline-offset-2"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
