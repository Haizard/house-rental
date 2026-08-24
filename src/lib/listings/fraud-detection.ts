import { prisma } from "@/lib/db/prisma";

export type FraudCheckResult = {
  isSuspicious: boolean;
  reasons: string[];
  score: number; // 0-100, higher = more suspicious
};

/**
 * Run fraud detection checks on a listing before it goes live.
 * Returns a risk score and list of reasons.
 */
export async function detectFraud(
  listingId: string,
  agentId: string,
  data: {
    title: string;
    description?: string | null;
    rentAmount: number;
    propertyType: string;
    imageUrl?: string | null;
  }
): Promise<FraudCheckResult> {
  const reasons: string[] = [];
  let score = 0;

  // Check 1: Price far below area average
  const priceCheck = await checkPriceAnomaly(data.rentAmount, data.propertyType);
  if (priceCheck.suspicious) {
    reasons.push(priceCheck.reason);
    score += priceCheck.score;
  }

  // Check 2: Duplicate images across listings
  if (data.imageUrl) {
    const imageCheck = await checkDuplicateImages(data.imageUrl, listingId);
    if (imageCheck.suspicious) {
      reasons.push(imageCheck.reason);
      score += imageCheck.score;
    }
  }

  // Check 3: Similar description to existing listings
  if (data.description) {
    const descCheck = await checkDuplicateDescription(data.description, listingId, agentId);
    if (descCheck.suspicious) {
      reasons.push(descCheck.reason);
      score += descCheck.score;
    }
  }

  // Check 4: Agent with too many flagged listings
  const agentCheck = await checkAgentHistory(agentId);
  if (agentCheck.suspicious) {
    reasons.push(agentCheck.reason);
    score += agentCheck.score;
  }

  return {
    isSuspicious: score >= 40,
    reasons,
    score: Math.min(score, 100),
  };
}

async function checkPriceAnomaly(
  rentAmount: number,
  propertyType: string
): Promise<{ suspicious: boolean; reason: string; score: number }> {
  try {
    const result = await prisma.$queryRaw<{ avg_price: number }[]>`
      SELECT AVG(rent_amount) as avg_price
      FROM listings l
      JOIN properties p ON p.id = l.property_id
      WHERE l.status = 'ACTIVE'
        AND l.property_type = ${propertyType}
        AND l.created_at > NOW() - INTERVAL '90 days'
    `;

    const avgPrice = Number(result[0]?.avg_price ?? 0);
    if (avgPrice === 0) return { suspicious: false, reason: "", score: 0 };

    const ratio = rentAmount / avgPrice;
    if (ratio < 0.3) {
      return {
        suspicious: true,
        reason: `Price is ${Math.round((1 - ratio) * 100)}% below area average for ${propertyType}`,
        score: 30,
      };
    }
    if (ratio < 0.5) {
      return {
        suspicious: true,
        reason: `Price is significantly below market rate for ${propertyType}`,
        score: 15,
      };
    }
  } catch {
    // Ignore DB errors
  }
  return { suspicious: false, reason: "", score: 0 };
}

async function checkDuplicateImages(
  imageUrl: string,
  currentListingId: string
): Promise<{ suspicious: boolean; reason: string; score: number }> {
  try {
    const count = await prisma.listingImage.count({
      where: {
        url: imageUrl,
        listingId: { not: currentListingId },
      },
    });

    if (count > 0) {
      return {
        suspicious: true,
        reason: `Image is used in ${count} other listing${count > 1 ? "s" : ""}`,
        score: 35,
      };
    }
  } catch {
    // Ignore
  }
  return { suspicious: false, reason: "", score: 0 };
}

async function checkDuplicateDescription(
  description: string,
  currentListingId: string,
  agentId: string
): Promise<{ suspicious: boolean; reason: string; score: number }> {
  if (description.length < 50) return { suspicious: false, reason: "", score: 0 };

  try {
    // Check if another agent has a very similar description
    const others = await prisma.listing.findMany({
      where: {
        id: { not: currentListingId },
        agentId: { not: agentId },
        description: { not: null },
        status: { in: ["ACTIVE", "DRAFT"] },
      },
      select: { id: true, description: true },
      take: 50,
    });

    for (const other of others) {
      if (!other.description) continue;
      const similarity = calculateSimilarity(description, other.description);
      if (similarity > 0.8) {
        return {
          suspicious: true,
          reason: `Description is ${Math.round(similarity * 100)}% similar to another listing`,
          score: 25,
        };
      }
    }
  } catch {
    // Ignore
  }
  return { suspicious: false, reason: "", score: 0 };
}

async function checkAgentHistory(
  agentId: string
): Promise<{ suspicious: boolean; reason: string; score: number }> {
  try {
    const flaggedCount = await prisma.listing.count({
      where: {
        agentId,
        isFlagged: true,
      },
    });

    if (flaggedCount >= 3) {
      return {
        suspicious: true,
        reason: `Agent has ${flaggedCount} previously flagged listings`,
        score: 20,
      };
    }
  } catch {
    // Ignore
  }
  return { suspicious: false, reason: "", score: 0 };
}

/**
 * Simple Jaccard similarity for short texts.
 * Splits into words, calculates intersection/union.
 */
function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 3));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection++;
  }

  const union = wordsA.size + wordsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
