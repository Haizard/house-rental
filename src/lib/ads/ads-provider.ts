import { ADS_CONFIG } from "./ads-config";
import type { Placement } from "./eligibility";
import { getPlacement } from "./placements";

/**
 * Abstract ad provider interface.
 * Swap implementations without changing the rest of the app.
 */
export interface AdsProvider {
  isEnabled(): boolean;
  getSlotId(placement: Placement): string | null;
  getAdFormat(placement: Placement): string;
  isProduction(): boolean;
}

/**
 * Google AdSense provider implementation.
 */
class AdSenseProvider implements AdsProvider {
  isEnabled(): boolean {
    return ADS_CONFIG.isProduction;
  }

  getSlotId(placement: Placement): string | null {
    const config = getPlacement(placement);
    if (!config?.enabled) return null;
    // Slot IDs come from environment or placement config
    return config.slotId ?? null;
  }

  getAdFormat(placement: Placement): string {
    return getPlacement(placement)?.adFormat ?? "auto";
  }

  isProduction(): boolean {
    return ADS_CONFIG.isProduction;
  }
}

/**
 * Development/test provider — shows placeholders.
 */
class DevAdsProvider implements AdsProvider {
  isEnabled(): boolean {
    return ADS_CONFIG.enabled; // respects the master switch
  }

  getSlotId(_placement: Placement): string | null {
    return "dev-slot";
  }

  getAdFormat(placement: Placement): string {
    return getPlacement(placement)?.adFormat ?? "auto";
  }

  isProduction(): boolean {
    return false;
  }
}

/** Singleton provider based on environment */
export const adsProvider: AdsProvider = ADS_CONFIG.isProduction
  ? new AdSenseProvider()
  : new DevAdsProvider();
