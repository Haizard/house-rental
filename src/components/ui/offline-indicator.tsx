"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { getOfflineCacheSize } from "@/lib/offline/indexed-db";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [cacheCount, setCacheCount] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    function handleOnline() {
      setIsOnline(true);
      setShowBanner(false);
    }

    function handleOffline() {
      setIsOnline(false);
      setShowBanner(true);
      // Check cache size
      getOfflineCacheSize().then((size) => setCacheCount(size.listings));
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial cache size if offline
    if (!navigator.onLine) {
      getOfflineCacheSize().then((size) => setCacheCount(size.listings));
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-dismiss "back online" banner after 3s
  useEffect(() => {
    if (isOnline && showBanner) {
      const timer = setTimeout(() => setShowBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showBanner]);

  if (!showBanner && isOnline) return null;

  return (
    <div
      className={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 px-4 py-2.5 text-sm font-medium shadow-lg transition-all duration-300 ${
        isOnline
          ? "translate-y-0 opacity-100 bg-[#FBC618]/100/90 text-white"
          : "translate-y-0 opacity-100 bg-orange-500/90 text-white"
      }`}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <Wifi size={16} />
            <span>Back online</span>
          </>
        ) : (
          <>
            <WifiOff size={16} />
            <span>
              You&apos;re offline
              {cacheCount > 0 && (
                <span className="ml-1 text-white/80">
                  · {cacheCount} cached {cacheCount === 1 ? "listing" : "listings"}
                </span>
              )}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
