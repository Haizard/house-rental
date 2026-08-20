"use client";

import { CheckCircle, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";

export function Toast({
  message,
  type = "success",
  onDismiss,
  duration = 3000,
}: {
  message: string;
  type?: ToastType;
  onDismiss?: () => void;
  duration?: number;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  if (!visible) return null;

  const icons = {
    success: <CheckCircle size={18} className="text-[var(--success)]" />,
    error: <XCircle size={18} className="text-[var(--danger)]" />,
    info: null,
  };

  const bgColors = {
    success: "bg-[var(--success-soft)]",
    error: "bg-[var(--danger-soft)]",
    info: "bg-[var(--accent-soft)]",
  };

  return (
    <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 animate-slide-down">
      <div
        className={`glass-surface flex items-center gap-3 px-4 py-3 shadow-lg ${bgColors[type]}`}
        role="status"
      >
        {icons[type]}
        <span className="text-sm font-medium">{message}</span>
        <button
          className="ml-2 text-[var(--text-secondary)]"
          onClick={() => {
            setVisible(false);
            onDismiss?.();
          }}
          type="button"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// Simple toast manager for use outside React components
let toastCallback: ((message: string, type: ToastType) => void) | null = null;

export function setToastHandler(handler: (message: string, type: ToastType) => void) {
  toastCallback = handler;
}

export function showToast(message: string, type: ToastType = "success") {
  toastCallback?.(message, type);
}
