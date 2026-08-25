"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationProvider() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }
    setSupported(true);
    setPermission(Notification.permission);

    // Check if already subscribed
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((subscription) => {
        setIsSubscribed(!!subscription);
      });
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!supported || loading) return;
    setLoading(true);

    try {
      // Request permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        setLoading(false);
        return;
      }

      // Get VAPID key
      const keyRes = await fetch("/api/push/vapid-public-key");
      const { publicKey } = await keyRes.json();
      if (!publicKey) throw new Error("VAPID key not available");

      // Subscribe to push
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const sub = subscription.toJSON();
      if (!sub.endpoint || !sub.keys) throw new Error("Invalid subscription");

      // Save subscription on server
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
          userAgent: navigator.userAgent,
        }),
      });

      setIsSubscribed(true);
    } catch (err) {
      console.error("Push subscription failed:", err);
    } finally {
      setLoading(false);
    }
  }, [supported, loading]);

  const unsubscribe = useCallback(async () => {
    if (!supported || loading) return;
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Notify server to remove subscription
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    } finally {
      setLoading(false);
    }
  }, [supported, loading]);

  if (!supported) return null;

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={loading}
      className="button button-glass flex items-center gap-2"
      title={isSubscribed ? "Disable notifications" : "Enable notifications"}
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      ) : isSubscribed ? (
        <BellRing size={16} className="text-[var(--accent)]" />
      ) : permission === "denied" ? (
        <BellOff size={16} className="text-red-400" />
      ) : (
        <Bell size={16} />
      )}
      <span className="text-xs font-medium">
        {loading
          ? "..."
          : permission === "denied"
          ? "Notifications blocked"
          : isSubscribed
          ? "Notifications on"
          : "Enable notifications"}
      </span>
    </button>
  );
}
