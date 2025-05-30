"use client";

import ErrorBoundary from "@/components/error-boundary";
import { useEffect, useCallback } from "react";
import SuspenseSearchParams from "@/components/suspense-search-params";

export default function ErrorClient({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Enhanced error logging for debugging
    console.error("Application error:", {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      name: error.name,
      cause: error.cause,
    });

    // Always log errors to help with debugging
    try {
      fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "client-error",
          error: {
            message: error.message,
            digest: error.digest,
            name: error.name,
            stack: error.stack
              ? error.stack.split("\n").slice(0, 5).join("\n")
              : null,
          },
        }),
      }).catch(() => {
        // Silent catch - don't let error logging cause more errors
      });
    } catch (e) {
      // Ignore errors in the error handler
    }

    // Try to clear cache if it might be a stale data issue
    try {
      fetch("/api/restart").catch(() => {
        // Silent catch
      });
    } catch (e) {
      // Ignore errors
    }
  }, [error]);

  // Handle search params changes
  const handleParamsChange = useCallback((params: URLSearchParams) => {
    // We don't need to do anything with the params here
    // Just having this function prevents the error
  }, []);

  return (
    <>
      <SuspenseSearchParams onParamsChange={handleParamsChange} fallback={null} />
      <ErrorBoundary error={error} reset={reset} />
    </>
  );
}
