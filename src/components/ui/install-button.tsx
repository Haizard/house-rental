"use client";

import { Download, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if running as installed PWA on iOS
    if ((window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    // If browser supports the install prompt
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      return;
    }

    // iOS Safari — show hint
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      setShowIOSHint(!showIOSHint);
      return;
    }
  }

  // Don't show if installed
  if (isInstalled) {
    return null;
  }

  // iOS hint popup
  if (showIOSHint) {
    return (
      <div className="glass-surface fixed right-4 top-16 z-50 max-w-[280px] rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2">
          <Smartphone size={18} className="text-[var(--accent)]" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Install Nyumba Nearby
          </p>
        </div>
        <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">
          Tap the <strong>Share</strong> button in Safari, then tap <strong>&quot;Add to Home Screen&quot;</strong> to install.
        </p>
        <button
          onClick={() => setShowIOSHint(false)}
          className="mt-4 w-full rounded-xl bg-[var(--accent)] px-3 py-2.5 text-xs font-semibold text-white"
        >
          Got it
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--accent)] to-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[var(--accent)]/25 transition-all hover:shadow-xl hover:shadow-[var(--accent)]/30 hover:scale-105 active:scale-95"
      aria-label="Install app"
    >
      <Download size={15} strokeWidth={2.5} />
      <span>Install App</span>
    </button>
  );
}
