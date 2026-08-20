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
  if (session.user.role !== "AGENT")
    return NextResponse.json({ error: "Only agents." }, { status: 403 });

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  const { id } = await params;
  const listing = await prisma.listing.findFirst({
    where: { id, agentId: agent.id },
    select: { id: true, status: true },
  });
  if (!listing)
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  if (listing.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Only active listings can be confirmed." },
      { status: 400 },
    );
  }

  // Update the listing's publishedAt to extend its lifetime
  // and reset any expiry tracking
  await prisma.listing.update({
    where: { id },
    data: {
      publishedAt: new Date(),
      expiresAt: null, // Clear expiry on confirmation
    },
  });

  return NextResponse.json({ ok: true });
}
