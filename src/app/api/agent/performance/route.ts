import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getAgentPerformance } from "@/lib/agents/performance";

/** GET — get performance metrics for the current agent */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT") return NextResponse.json({ error: "Agents only." }, { status: 403 });

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent) return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  const metrics = await getAgentPerformance(agent.id);
  return NextResponse.json({ data: metrics });
}
