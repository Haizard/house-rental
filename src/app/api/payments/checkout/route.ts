import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { createSubscriptionCheckout } from "@/lib/payments/stripe";

const checkoutSchema = z.object({
  planName: z.enum(["PRO", "STANDARD"]).default("PRO"),
});

/** POST — create a checkout session for subscription */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT") return NextResponse.json({ error: "Agents only." }, { status: 403 });

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent) return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  // Check if already subscribed
  const existingSub = await prisma.subscription.findFirst({
    where: {
      agentId: agent.id,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
  });
  if (existingSub) {
    return NextResponse.json({ error: "You already have an active subscription." }, { status: 409 });
  }

  // TZS 20,000 in smallest currency unit (cents for Stripe)
  const amount = 2000000; // 20,000 TZS = 2,000,000 cents

  const result = await createSubscriptionCheckout({
    agentId: agent.id,
    userId: session.user.id,
    email: session.user.email || "",
    planName: parsed.data.planName,
    amount,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ data: { url: result.url, sessionId: result.sessionId } });
}
