import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to enable notifications." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.endpoint || !body?.p256dh || !body?.auth) {
    return NextResponse.json({ error: "Invalid subscription data." }, { status: 400 });
  }

  try {
    // Upsert subscription (endpoint is unique per user)
    const existing = await prisma.pushSubscription.findUnique({
      where: { userId_endpoint: { userId: session.user.id, endpoint: body.endpoint } },
    });

    if (existing) {
      // Reactivate if was disabled
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: { isActive: true, p256dhKey: body.p256dh, authKey: body.auth, userAgent: body.userAgent || null },
      });
    } else {
      await prisma.pushSubscription.create({
        data: {
          userId: session.user.id,
          endpoint: body.endpoint,
          p256dhKey: body.p256dh,
          authKey: body.auth,
          userAgent: body.userAgent || null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Push subscription error:", err);
    return NextResponse.json({ error: "Failed to save subscription." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.endpoint) {
    return NextResponse.json({ error: "Endpoint required." }, { status: 400 });
  }

  try {
    await prisma.pushSubscription.deleteMany({
      where: { userId: session.user.id, endpoint: body.endpoint },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true }); // idempotent
  }
}
