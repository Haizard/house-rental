import { prisma } from "@/lib/db/prisma";

type Recommendation = {
  id: string;
  title: string;
  type: string;
  area: string;
  price: number;
  image: string;
  verified: boolean;
  agentId: string;
  matchScore: number;
  matchReasons: string[];
};

/**
 * Get personalized listing recommendations for a student.
 * Uses preferences, saved searches, and viewing history.
 */
export async function getRecommendations(
  userId: string,
  limit = 8
): Promise<Recommendation[]> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      budgetMin: true,
      budgetMax: true,
      preferredArea: true,
      roomType: true,
      universityId: true,
      university: { select: { name: true } },
    },
  });

  if (!profile) return [];

  // Get saved search criteria
  const savedSearches = await prisma.savedSearch.findMany({
    where: { studentId: profile.id },
    select: { area: true, propertyType: true, minPrice: true, maxPrice: true, gender: true },
    take: 5,
  });

  // Get saved listing IDs (to exclude)
  const savedIds = (
    await prisma.savedListing.findMany({
      where: { studentId: profile.id },
      select: { listingId: true },
    })
  ).map((s) => s.listingId);

  // Get recently viewed listing IDs (from leads/conversations)
  const viewedIds = (
    await prisma.lead.findMany({
      where: { studentId: profile.id },
      select: { listingId: true },
      take: 10,
    })
  ).map((l) => l.listingId);

  // Fetch active listings
  const listings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      id: { notIn: [...savedIds, ...viewedIds] },
    },
    include: {
      property: { select: { area: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      amenities: { include: { amenity: { select: { slug: true } } } },
    },
    take: 50,
    orderBy: { publishedAt: "desc" },
  });

  // Score each listing
  const scored = listings.map((listing) => {
    let score = 0;
    const reasons: string[] = [];

    // Area match (30 points)
    const area = listing.property.area.toLowerCase();
    if (profile.preferredArea?.toLowerCase() === area) {
      score += 30;
      reasons.push("Matches your preferred area");
    }
    for (const search of savedSearches) {
      if (search.area?.toLowerCase() === area) {
        score += 15;
        reasons.push("Matches a saved search");
        break;
      }
    }

    // Price range match (30 points)
    const price = listing.rentAmount;
    const min = profile.budgetMin ?? 0;
    const max = profile.budgetMax ?? Infinity;
    if (price >= min && price <= max) {
      score += 30;
      reasons.push("Within your budget");
    } else if (price < min * 1.2 && price > min * 0.5) {
      score += 15;
      reasons.push("Close to your budget");
    }

    // Property type match (20 points)
    if (profile.roomType && listing.propertyType === profile.roomType) {
      score += 20;
      reasons.push("Matches your room type preference");
    }
    for (const search of savedSearches) {
      if (search.propertyType === listing.propertyType) {
        score += 10;
        reasons.push("Matches a saved search type");
        break;
      }
    }

    // Amenity overlap (10 points)
    const listingSlugs = new Set(listing.amenities.map((a) => a.amenity.slug));
    const preferredAmenities = ["wifi", "water", "parking"];
    const matches = preferredAmenities.filter((s) => listingSlugs.has(s));
    if (matches.length > 0) {
      score += Math.min(matches.length * 3, 10);
      if (matches.includes("wifi")) reasons.push("Has Wi-Fi");
    }

    // Recency bonus (5 points)
    if (listing.publishedAt) {
      const daysSince = (Date.now() - listing.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        score += 5;
        reasons.push("Recently listed");
      }
    }

    // Verified bonus (5 points)
    if (
      listing.verificationStatus === "VERIFIED" ||
      listing.verificationStatus === "PROPERTY_VERIFIED"
    ) {
      score += 5;
      reasons.push("Verified listing");
    }

    return {
      id: listing.id,
      title: listing.title,
      type: listing.propertyType,
      area: listing.property.area,
      price: listing.rentAmount,
      image: listing.images[0]?.url ?? "/listing-placeholder.svg",
      verified:
        listing.verificationStatus === "VERIFIED" ||
        listing.verificationStatus === "PROPERTY_VERIFIED" ||
        listing.verificationStatus === "OWNER_VERIFIED",
      agentId: listing.agentId,
      matchScore: score,
      matchReasons: reasons.slice(0, 3),
    };
  });

  // Sort by score, take top N
  return scored
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}
