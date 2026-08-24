import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

/** POST — flag a review */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await params;

  // Check if review exists
  const review = await prisma.review.findUnique({
    where: { id },
    select: { id: true, flagCount: true, isHidden: true },
  });
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  if (review.isHidden) return NextResponse.json({ error: "Review is already hidden." }, { status: 400 });

  // Check if user already flagged
  try {
    const existing = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM review_flags
      WHERE review_id = ${id}::uuid AND user_id = ${session.user.id}::uuid
      LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: "You already flagged this review." }, { status: 409 });
    }
  } catch {
    // Table might not exist — create it
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS review_flags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(review_id, user_id)
      )
    `;
  }

  // Create flag
  await prisma.$executeRaw`
    INSERT INTO review_flags (id, review_id, user_id, created_at)
    VALUES (gen_random_uuid(), ${id}::uuid, ${session.user.id}::uuid, NOW())
    ON CONFLICT (review_id, user_id) DO NOTHING
  `;

  // Increment flag count
  const newCount = (review.flagCount || 0) + 1;

  // If 3+ flags, hide the review
  const shouldHide = newCount >= 3;

  await prisma.review.update({
    where: { id },
    data: {
      flagCount: newCount,
      isHidden: shouldHide,
    },
  });

  if (shouldHide) {
    // Notify admin
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    if (admin) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "REVIEW_FLAGGED",
          title: "Review auto-hidden",
          message: `A review has been hidden after ${newCount} flags. Review ID: ${id}`,
          data: { reviewId: id, flagCount: newCount },
        },
      });
    }
  }

  return NextResponse.json({ ok: true, flagCount: newCount, hidden: shouldHide });
}
