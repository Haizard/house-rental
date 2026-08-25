import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

const statusSchema = z.enum(["ACCEPTED", "DECLINED", "COMPLETED", "CANCELLED"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in to manage viewings." }, { status: 401 });
  if (session.user.role !== "AGENT") return NextResponse.json({ error: "Only agents can manage viewings." }, { status: 403 });

  const parsed = statusSchema.safeParse((await request.json().catch(() => null))?.status);
  if (!parsed.success) return NextResponse.json({ error: "Unsupported viewing status." }, { status: 400 });
  const { id } = await params;
  const agent = await prisma.agentProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!agent) return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  const viewing = await prisma.viewingRequest.findFirst({ where: { id, lead: { agentId: agent.id } }, select: { id: true, leadId: true } });
  if (!viewing) return NextResponse.json({ error: "Viewing request not found." }, { status: 404 });

  const updated = await prisma.$transaction(async (transaction) => {
    const result = await transaction.viewingRequest.update({ where: { id: viewing.id }, data: { status: parsed.data } });
    if (parsed.data === "ACCEPTED") await transaction.lead.update({ where: { id: viewing.leadId }, data: { status: "VIEWING_CONFIRMED" } });
    if (parsed.data === "COMPLETED") await transaction.lead.update({ where: { id: viewing.leadId }, data: { status: "VIEWED" } });
    return result;
  });

  // Send email on acceptance (non-blocking)
  if (parsed.data === "ACCEPTED") {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: viewing.leadId },
        select: {
          student: { select: { user: { select: { email: true, firstName: true } } } },
          listing: { select: { title: true } },
        },
      });
      if (lead?.student?.user?.email) {
        const agentUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { firstName: true } });
        const { sendViewingConfirmation } = await import("@/lib/email/resend");
        await sendViewingConfirmation({
          studentEmail: lead.student.user.email,
          studentName: lead.student.user.firstName,
          agentName: agentUser?.firstName || "Your agent",
          listingTitle: lead.listing.title,
          scheduledAt: new Intl.DateTimeFormat("en-TZ", { dateStyle: "full", timeStyle: "short" }).format(updated.scheduledAt || new Date()),
          chatUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/student/chats`,
        });
      }
    } catch { /* email is best-effort */ }
  }

  // Send push notification to student (non-blocking)
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: viewing.leadId },
      select: {
        student: { select: { userId: true } },
        agent: { select: { businessName: true } },
        listing: { select: { title: true } },
      },
    });
    if (lead?.student?.userId) {
      const statusText = parsed.data === "ACCEPTED" ? "accepted" : parsed.data === "DECLINED" ? "declined" : parsed.data.toLowerCase();
      const { sendPushToUser } = await import("@/lib/push/web-push");
      sendPushToUser(lead.student.userId, {
        title: `Viewing ${statusText}`,
        body: `${lead.agent.businessName} ${statusText} your viewing request for ${lead.listing.title}.`,
        url: "/student/dashboard",
        tag: `viewing-${viewing.id}`,
        data: { type: "VIEWING", viewingId: viewing.id, status: parsed.data },
      }).catch(() => {});
    }
  } catch { /* push is best-effort */ }

  return NextResponse.json({ data: { id: updated.id, status: updated.status } });
}
