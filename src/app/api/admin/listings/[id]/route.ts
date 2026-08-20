import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "REJECTED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });

  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!listing)
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const data: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === "ACTIVE") {
    data.publishedAt = new Date();
  }

  const updated = await prisma.listing.update({
    where: { id },
    data,
    select: { id: true, status: true },
  });

  return NextResponse.json({ data: updated });
}
