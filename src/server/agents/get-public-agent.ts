import { agents, type Agent } from "@/lib/agents";
import { listings as demoListings, type Listing } from "@/lib/listings";
import { prisma } from "@/lib/db/prisma";

export async function getPublicAgent(id: string): Promise<{ agent: Agent; listings: Listing[] } | null> {
  try {
    const record = await prisma.agentProfile.findUnique({
      where: { id },
      include: {
        listings: {
          where: { status: "ACTIVE" },
          include: { property: { select: { area: true } }, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
          orderBy: { publishedAt: "desc" },
        },
      },
    });
    if (record) {
      return {
        agent: { id: record.id, businessName: record.businessName, bio: record.bio ?? "", photo: record.photoUrl ?? "/listing-placeholder.svg", rating: Number(record.rating), reviews: record.totalReviews, verified: record.verification === "VERIFIED" || record.verification === "AGENT_VERIFIED", activeListings: record.listings.length },
        listings: record.listings.map((listing) => ({ id: listing.id, title: listing.title, type: listing.propertyType, area: listing.property.area, price: listing.rentAmount, image: listing.images[0]?.url ?? "/listing-placeholder.svg", verified: listing.verificationStatus === "VERIFIED" || listing.verificationStatus === "PROPERTY_VERIFIED" || listing.verificationStatus === "OWNER_VERIFIED", agentId: record.id })),
      };
    }
  } catch (error) {
    console.warn("Agent profile is temporarily unavailable.", error);
  }

  const agent = agents.find((item) => item.id === id);
  return agent ? { agent, listings: demoListings.filter((listing) => listing.agentId === id) } : null;
}
