"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed in this session
    if (sessionStorage.getItem("install-dismissed")) {
      setIsDismissed(true);
      return;
    }

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
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setIsDismissed(true);
    sessionStorage.setItem("install-dismissed", "true");
  }

  // Don't show if installed or dismissed
  if (isInstalled || isDismissed || !deferredPrompt) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:shadow-md"
        aria-label="Install app"
      >
        <Download size={14} />
        <span className="hidden sm:inline">Install</span>
      </button>
      <button
        onClick={handleDismiss}
        className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-gray-400 text-white transition hover:bg-gray-500"
        aria-label="Dismiss install prompt"
      >
        <X size={10} />
      </button>
    </div>
  );
}
