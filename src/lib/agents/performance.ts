import { prisma } from "@/lib/db/prisma";

export type PerformanceMetrics = {
  // Response metrics
  responseRate: number; // % of leads responded to within 24h
  avgResponseMinutes: number | null;
  // Volume metrics
  totalLeads: number;
  leadsThisMonth: number;
  totalListings: number;
  activeListings: number;
  // Conversion metrics
  inquiryToViewingRate: number; // % of leads that become viewings
  viewingToRentedRate: number; // % of viewings that become rented
  overallConversionRate: number; // % of leads that become rented
  // Status breakdown
  leadsByStatus: Record<string, number>;
  // Score
  performanceScore: number; // 0-100
};

/**
 * Calculate comprehensive performance metrics for an agent.
 */
export async function getAgentPerformance(agentId: string): Promise<PerformanceMetrics> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Fetch all leads
  const leads = await prisma.lead.findMany({
    where: { agentId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Fetch agent profile
  const agent = await prisma.agentProfile.findUnique({
    where: { id: agentId },
    select: {
      avgResponseMinutes: true,
      totalReviews: true,
      rating: true,
    },
  });

  // Fetch listings
  const listings = await prisma.listing.findMany({
    where: { agentId },
    select: { id: true, status: true },
  });

  // Fetch conversations for response time calculation
  const conversations = await prisma.conversation.findMany({
    where: { lead: { agentId } },
    select: {
      id: true,
      leadId: true,
      lastMessageAt: true,
      messages: {
        orderBy: { createdAt: "asc" },
        take: 2,
        select: { createdAt: true, senderId: true },
      },
    },
  });

  // Calculate response rate (leads with conversation = responded)
  const respondedLeads = leads.filter((l) =>
    conversations.some((c) => c.leadId === l.id)
  );
  const responseRate = leads.length > 0
    ? Math.round((respondedLeads.length / leads.length) * 100)
    : 0;

  // Calculate average response time from conversations
  let totalResponseMinutes = 0;
  let responseCount = 0;

  for (const conv of conversations) {
    if (conv.messages.length >= 2) {
      const studentMsg = conv.messages[0];
      const agentMsg = conv.messages[1];
      if (agentMsg && studentMsg) {
        const diff = agentMsg.createdAt.getTime() - studentMsg.createdAt.getTime();
        const minutes = diff / (1000 * 60);
        if (minutes > 0 && minutes < 10080) { // within 7 days
          totalResponseMinutes += minutes;
          responseCount++;
        }
      }
    }
  }

  const avgResponseMinutes = responseCount > 0
    ? Math.round(totalResponseMinutes / responseCount)
    : agent?.avgResponseMinutes ?? null;

  // Lead counts
  const totalLeads = leads.length;
  const leadsThisMonth = leads.filter((l) => l.createdAt >= thirtyDaysAgo).length;

  // Listing counts
  const totalListings = listings.length;
  const activeListings = listings.filter((l) => l.status === "ACTIVE").length;

  // Conversion rates
  const viewingLeads = leads.filter((l) =>
    ["VIEWING_REQUESTED", "VIEWING_CONFIRMED", "VIEWED", "RENTED"].includes(l.status)
  );
  const rentedLeads = leads.filter((l) => l.status === "RENTED");

  const inquiryToViewingRate = totalLeads > 0
    ? Math.round((viewingLeads.length / totalLeads) * 100)
    : 0;

  const viewingToRentedRate = viewingLeads.length > 0
    ? Math.round((rentedLeads.length / viewingLeads.length) * 100)
    : 0;

  const overallConversionRate = totalLeads > 0
    ? Math.round((rentedLeads.length / totalLeads) * 100)
    : 0;

  // Leads by status
  const leadsByStatus: Record<string, number> = {};
  for (const lead of leads) {
    leadsByStatus[lead.status] = (leadsByStatus[lead.status] || 0) + 1;
  }

  // Performance score (0-100)
  const performanceScore = calculatePerformanceScore({
    responseRate,
    avgResponseMinutes,
    inquiryToViewingRate,
    overallConversionRate,
    totalLeads,
    totalListings,
    rating: Number(agent?.rating ?? 0),
    totalReviews: agent?.totalReviews ?? 0,
  });

  return {
    responseRate,
    avgResponseMinutes,
    totalLeads,
    leadsThisMonth,
    totalListings,
    activeListings,
    inquiryToViewingRate,
    viewingToRentedRate,
    overallConversionRate,
    leadsByStatus,
    performanceScore,
  };
}

function calculatePerformanceScore(metrics: {
  responseRate: number;
  avgResponseMinutes: number | null;
  inquiryToViewingRate: number;
  overallConversionRate: number;
  totalLeads: number;
  totalListings: number;
  rating: number;
  totalReviews: number;
}): number {
  let score = 0;

  // Response rate (25 points)
  score += (metrics.responseRate / 100) * 25;

  // Response time (20 points)
  if (metrics.avgResponseMinutes !== null) {
    if (metrics.avgResponseMinutes < 60) score += 20;
    else if (metrics.avgResponseMinutes < 240) score += 15;
    else if (metrics.avgResponseMinutes < 1440) score += 10;
    else score += 5;
  } else {
    score += 10; // Default if no data
  }

  // Conversion rate (25 points)
  score += (metrics.overallConversionRate / 100) * 25;

  // Activity (15 points)
  if (metrics.totalListings >= 5) score += 15;
  else if (metrics.totalListings >= 3) score += 10;
  else if (metrics.totalListings >= 1) score += 5;

  // Rating (15 points)
  if (metrics.totalReviews > 0) {
    score += (metrics.rating / 5) * 15;
  } else {
    score += 7.5; // Default if no reviews
  }

  return Math.min(Math.round(score), 100);
}
