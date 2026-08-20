import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in to view billing." }, { status: 401 });
  if (session.user.role !== "AGENT") return NextResponse.json({ error: "Only agents can view billing." }, { status: 403 });

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      leads: { include: { charges: true }, orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!agent) return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  return NextResponse.json({
    data: {
      subscription: agent.subscriptions[0] ?? null,
      leadCharges: agent.leads.flatMap((lead) => lead.charges.map((charge) => ({ ...charge, leadId: lead.id }))),
    },
  });
}
