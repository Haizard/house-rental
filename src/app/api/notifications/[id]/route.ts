import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;
  const notification = await prisma.notification.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!notification)
    return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
