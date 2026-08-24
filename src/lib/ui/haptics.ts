/**
 * Haptic feedback utility using the Web Vibration API.
 * Only works on Android Chrome; silently no-ops on iOS and unsupported browsers.
 */

type HapticPattern = "light" | "medium" | "heavy" | "success" | "error";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [15, 50, 15],
  error: [50, 30, 50],
};

/**
 * Trigger haptic feedback if supported.
 */
export function haptic(pattern: HapticPattern = "light"): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(PATTERNS[pattern]);
    } catch {
      // Silently ignore — some browsers throw on vibrate
    }
  }
}
