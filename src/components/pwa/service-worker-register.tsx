"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for PWA support.
 * Only runs in production and in the browser.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered:", registration.scope);
      })
      .catch((error) => {
        console.warn("SW registration failed:", error);
      });
  }, []);

  return null;
}
