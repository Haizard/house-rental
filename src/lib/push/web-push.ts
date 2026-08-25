import webPush from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || "mailto:noreply@nyumbanearby.com";

let configured = false;

function getWebPush() {
  if (!configured && vapidPublicKey && vapidPrivateKey) {
    webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
    configured = true;
  }
  return webPush;
}

export type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
};

export async function sendPushNotification(
  subscription: { endpoint: string; p256dhKey: string; authKey: string },
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const push = getWebPush();
    const body = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icons/icon-192.png",
      badge: payload.badge || "/icons/icon-192.png",
      url: payload.url || "/",
      tag: payload.tag || "nyumba-notification",
      data: payload.data || {},
    });

    await push.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dhKey,
          auth: subscription.authKey,
        },
      },
      body
    );

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // 410 = subscription expired, 404 = subscription not found
    // These should trigger cleanup of the subscription
    const shouldRemove = message.includes("410") || message.includes("404");
    return { success: false, error: shouldRemove ? "EXPIRED" : message };
  }
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number; removed: number }> {
  // We import prisma here to avoid circular deps
  const { prisma } = await import("@/lib/db/prisma");

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId, isActive: true },
  });

  let sent = 0;
  let failed = 0;
  let removed = 0;

  for (const sub of subscriptions) {
    const result = await sendPushNotification(
      { endpoint: sub.endpoint, p256dhKey: sub.p256dhKey, authKey: sub.authKey },
      payload
    );

    if (result.success) {
      sent++;
    } else {
      failed++;
      // Remove expired/invalid subscriptions
      if (result.error === "EXPIRED") {
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
        removed++;
      }
    }
  }

  return { sent, failed, removed };
}

export async function sendPushToMultipleUsers(
  userIds: string[],
  payload: PushPayload
): Promise<{ totalSent: number; totalFailed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendPushToUser(userId, payload);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { totalSent, totalFailed };
}
