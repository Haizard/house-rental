import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

/**
 * Detects potential duplicate listings by comparing titles, areas, and rent amounts.
 * Admin-only endpoint.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Admin only." }, { status: 403 });

  // Get all active listings with basic info
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      title: true,
      rentAmount: true,
      propertyType: true,
      property: { select: { area: true, address: true } },
      agent: { select: { businessName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Simple duplicate detection: same area + similar title + similar price
  const duplicates: Array<{
    listing1: (typeof listings)[0];
    listing2: (typeof listings)[0];
    confidence: "HIGH" | "MEDIUM";
    reasons: string[];
  }> = [];

  for (let i = 0; i < listings.length; i++) {
    for (let j = i + 1; j < listings.length; j++) {
      const a = listings[i];
      const b = listings[j];
      const reasons: string[] = [];
      let score = 0;

      // Same area
      if (a.property.area.toLowerCase() === b.property.area.toLowerCase()) {
        reasons.push("Same area");
        score += 1;
      }

      // Similar rent (within 20%)
      const priceDiff = Math.abs(a.rentAmount - b.rentAmount);
      const avgPrice = (a.rentAmount + b.rentAmount) / 2;
      if (avgPrice > 0 && priceDiff / avgPrice < 0.2) {
        reasons.push("Similar price");
        score += 1;
      }

      // Same property type
      if (a.propertyType === b.propertyType) {
        reasons.push("Same property type");
        score += 0.5;
      }

      // Title similarity (simple word overlap)
      const wordsA = new Set(
        a.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
      );
      const wordsB = new Set(
        b.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
      );
      const overlap = [...wordsA].filter((w) => wordsB.has(w)).length;
      const totalWords = new Set([...wordsA, ...wordsB]).size;
      if (totalWords > 0 && overlap / totalWords > 0.4) {
        reasons.push("Similar title");
        score += 1;
      }

      // Same agent (less suspicious — they might have multiple units)
      if (a.agent.businessName === b.agent.businessName) {
        reasons.push("Same agent");
        score -= 0.5; // Reduce confidence for same agent
      }

      if (score >= 2 && reasons.length >= 2) {
        duplicates.push({
          listing1: a,
          listing2: b,
          confidence: score >= 3 ? "HIGH" : "MEDIUM",
          reasons,
        });
      }
    }
  }

  return NextResponse.json({
    data: duplicates.slice(0, 20), // Limit results
    total: duplicates.length,
  });
}
