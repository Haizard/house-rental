"use client";

import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-surface max-w-md p-8 text-center">
        <AlertTriangle className="mx-auto text-[var(--warning)]" size={40} />
        <h1 className="mt-4 text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          {error.message || "An unexpected error occurred."}
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Error ID: {error.digest}
          </p>
        )}
        <button
          className="button button-primary mt-6 px-5"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
