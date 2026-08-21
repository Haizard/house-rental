"use client";

import { useEffect, useRef, useState } from "react";
import { ADS_CONFIG } from "@/lib/ads/ads-config";
import { adsProvider } from "@/lib/ads/ads-provider";
import type { Placement } from "@/lib/ads/eligibility";

interface AdSlotProps {
  placement: Placement;
  /** Whether the current user is eligible (passed from server) */
  eligible: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Reusable ad slot component.
 *
 * - In production: loads AdSense script and renders the ad unit
 * - In development: renders a styled placeholder
 * - Always reserves space to avoid layout shifts
 */
export function AdSlot({ placement, eligible, className = "" }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Don't render if not eligible or ads disabled
  if (!eligible || !adsProvider.isEnabled()) {
    return null;
  }

  const isProd = adsProvider.isProduction();

  useEffect(() => {
    if (!isProd || loaded) return;

    // Load AdSense script if not already present
    const scriptId = "adsense-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CONFIG.clientId}`;
      document.head.appendChild(script);
    }

    // Push ad unit
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).adsbygoogle.push({});
    } catch {
      // AdSense not ready yet
    }

    setLoaded(true);
  }, [isProd, loaded]);

  if (isProd) {
    // Production: real AdSense unit
    return (
      <div
        ref={containerRef}
        className={`ad-slot my-6 ${className}`}
        data-placement={placement}
      >
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={ADS_CONFIG.clientId}
          data-ad-slot={adsProvider.getSlotId(placement)}
          data-ad-format={adsProvider.getAdFormat(placement)}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Development: safe placeholder
  return (
    <div
      ref={containerRef}
      className={`ad-slot my-6 overflow-hidden rounded-xl border border-dashed border-[var(--glass-border)] bg-[var(--accent-soft)] ${className}`}
      data-placement={placement}
    >
      <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
        <div className="mb-2 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
          Ad Placeholder
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          {placement.replace(/_/g, " ")}
        </p>
        <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">
          Format: {adsProvider.getAdFormat(placement)} · Slot: {adsProvider.getSlotId(placement)}
        </p>
      </div>
    </div>
  );
}
