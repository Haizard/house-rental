import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in to save listings." }, { status: 401 });

  const { id: listingId } = await params;

  // Verify listing exists
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });
  if (!listing)
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  // Find student profile
  const student = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!student)
    return NextResponse.json({ error: "Student profile not found." }, { status: 404 });

  // Upsert saved listing (idempotent)
  await prisma.savedListing.upsert({
    where: {
      studentId_listingId: { studentId: student.id, listingId },
    },
    create: { studentId: student.id, listingId },
    update: {}, // already saved
  });

  return NextResponse.json({ saved: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in to unsave listings." }, { status: 401 });

  const { id: listingId } = await params;

  const student = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!student)
    return NextResponse.json({ error: "Student profile not found." }, { status: 404 });

  await prisma.savedListing.deleteMany({
    where: { studentId: student.id, listingId },
  });

  return NextResponse.json({ saved: false });
}
