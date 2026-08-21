"use client";

import { ADS_CONFIG } from "@/lib/ads/ads-config";
import Script from "next/script";

/**
 * Loads the Google AdSense script in production.
 * Place in the root layout — the script is lightweight and loads asynchronously.
 */
export function AdSenseScript() {
  if (!ADS_CONFIG.isProduction || !ADS_CONFIG.clientId) {
    return null;
  }

  return (
    <Script
      id="adsbygoogle"
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CONFIG.clientId}`}
      strategy="afterInteractive"
    />
  );
}
