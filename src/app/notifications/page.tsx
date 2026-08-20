import { Bell } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";
import { NotificationList } from "@/components/ui/notification-list";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-3xl">
      <header className="pb-8 pt-10">
        <p className="eyebrow">Account</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Notifications</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Updates about your listings, leads, and viewings.
        </p>
      </header>

      {notifications.length === 0 ? (
        <div className="glass-surface flex min-h-48 flex-col items-center justify-center p-8 text-center">
          <Bell
            className="text-[var(--text-tertiary)]"
            size={28}
            aria-hidden="true"
          />
          <h2 className="mt-3 font-semibold">No notifications yet</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            You&apos;ll see updates about leads, messages, and viewings here.
          </p>
        </div>
      ) : (
        <NotificationList
          notifications={notifications.map((n) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            readAt: n.readAt?.toISOString() ?? null,
            createdAt: n.createdAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}
