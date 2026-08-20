import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;

  // Upsert view record (unique constraint prevents duplicates)
  try {
    await prisma.statusView.upsert({
      where: {
        statusId_viewerId: { statusId: id, viewerId: session.user.id },
      },
      update: {},
      create: { statusId: id, viewerId: session.user.id },
    });
  } catch {
    // Status might not exist or already viewed — that's fine
  }

  return NextResponse.json({ ok: true });
}
