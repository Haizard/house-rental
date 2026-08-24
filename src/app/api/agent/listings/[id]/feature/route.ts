import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

/** POST — toggle featured status */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT") return NextResponse.json({ error: "Only agents can feature listings." }, { status: 403 });

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent) return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  const { id } = await params;
  const listing = await prisma.listing.findFirst({
    where: { id, agentId: agent.id },
    select: { id: true, isFeatured: true, featuredUntil: true },
  });
  if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const newFeatured = !listing.isFeatured;
  const featuredUntil = newFeatured
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    : null;

  await prisma.listing.update({
    where: { id },
    data: { isFeatured: newFeatured, featuredUntil },
  });

  return NextResponse.json({ isFeatured: newFeatured, featuredUntil });
}
