import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { AgentCalendarView } from "@/components/agent/agent-calendar-view";

export const dynamic = "force-dynamic";

export default async function AgentCalendarPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "AGENT") redirect("/auth/sign-in");

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent) redirect("/auth/sign-in");

  // Get all viewings for this agent
  const viewings = await prisma.viewingRequest.findMany({
    where: {
      lead: { agentId: agent.id },
    },
    include: {
      lead: {
        include: {
          student: {
            include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
          },
          listing: {
            include: {
              property: { select: { title: true, area: true, address: true } },
            },
          },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  // Get listings for the agent (for reference)
  const listings = await prisma.listing.findMany({
    where: { agentId: agent.id },
    select: { id: true, title: true },
  });

  return (
    <AgentCalendarView
      viewings={viewings.map((v) => ({
        id: v.id,
        scheduledAt: v.scheduledAt?.toISOString() || null,
        status: v.status,
        notes: v.notes,
        studentName: `${v.lead.student.user.firstName} ${v.lead.student.user.lastName}`,
        studentEmail: v.lead.student.user.email || "",
        listingTitle: v.lead.listing.property.title || "Untitled",
        listingArea: v.lead.listing.property.area,
      }))}
      listings={listings}
    />
  );
}
