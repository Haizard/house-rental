import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

const idSchema = z.string().uuid();

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in to save homes." }, { status: 401 });
  if (session.user.role !== "STUDENT") return NextResponse.json({ error: "Only students can save homes." }, { status: 403 });

  const { id } = await params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  const listing = await prisma.listing.findFirst({ where: { id, status: "ACTIVE" }, select: { id: true } });
  if (!profile || !listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  await prisma.savedListing.upsert({
    where: { studentId_listingId: { studentId: profile.id, listingId: listing.id } },
    update: {},
    create: { studentId: profile.id, listingId: listing.id },
  });

  return NextResponse.json({ saved: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in to manage saved homes." }, { status: 401 });
  if (session.user.role !== "STUDENT") return NextResponse.json({ error: "Only students can manage saved homes." }, { status: 403 });

  const { id } = await params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (profile) await prisma.savedListing.deleteMany({ where: { studentId: profile.id, listingId: id } });

  return NextResponse.json({ saved: false });
}
