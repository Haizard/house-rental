import { prisma } from "@/lib/db/prisma";

/**
 * Find an agent profile by user ID, handling the case where the `tier`
 * column doesn't exist in the database yet (migration not applied).
 *
 * After the migration is applied, this can be replaced with direct
 * prisma.agentProfile.findUnique calls.
 */
export async function findAgentProfile(
  userId: string,
  options?: { include?: Record<string, unknown> },
) {
  // Use raw SQL to avoid the tier column issue
  try {
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        user_id: string;
        business_name: string;
        bio: string | null;
        profile_photo_url: string | null;
        verification_status: string;
        rating: string;
        total_reviews: number;
        created_at: Date;
        updated_at: Date;
        tier: string | undefined;
      }>
    >`SELECT id, user_id, business_name, bio, profile_photo_url,
              verification_status, rating, total_reviews,
              created_at, updated_at, tier
       FROM agent_profiles WHERE user_id = ${userId}::uuid LIMIT 1`;

    if (!rows[0]) return null;

    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      businessName: row.business_name,
      bio: row.bio,
      photoUrl: row.profile_photo_url,
      verification: row.verification_status as
        | "UNVERIFIED"
        | "AGENT_VERIFIED"
        | "VERIFIED",
      rating: Number(row.rating),
      totalReviews: row.total_reviews,
      tier: (row.tier ?? "FREE") as "FREE" | "PRO",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch {
    // Extremely unlikely fallback
    return null;
  }
}

/**
 * Find an agent profile by primary key (id), handling missing tier column.
 */
export async function findAgentProfileById(id: string) {
  try {
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        user_id: string;
        business_name: string;
        bio: string | null;
        profile_photo_url: string | null;
        verification_status: string;
        rating: string;
        total_reviews: number;
        created_at: Date;
        updated_at: Date;
        tier: string | undefined;
      }>
    >`SELECT id, user_id, business_name, bio, profile_photo_url,
              verification_status, rating, total_reviews,
              created_at, updated_at, tier
       FROM agent_profiles WHERE id = ${id}::uuid LIMIT 1`;

    if (!rows[0]) return null;

    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      businessName: row.business_name,
      bio: row.bio,
      photoUrl: row.profile_photo_url,
      verification: row.verification_status as
        | "UNVERIFIED"
        | "AGENT_VERIFIED"
        | "VERIFIED",
      rating: Number(row.rating),
      totalReviews: row.total_reviews,
      tier: (row.tier ?? "FREE") as "FREE" | "PRO",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch {
    return null;
  }
}
