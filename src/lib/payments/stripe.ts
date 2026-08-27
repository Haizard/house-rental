import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  _stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  return _stripe;
}

export type CheckoutResult =
  | { ok: true; sessionId: string; url: string }
  | { ok: false; error: string };

/**
 * Create a Stripe Checkout session for agent subscription.
 */
export async function createSubscriptionCheckout(params: {
  agentId: string;
  userId: string;
  email: string;
  planName: string;
  amount: number; // in TZS
}): Promise<CheckoutResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, error: "Stripe is not configured." };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    // Create or retrieve Stripe customer
    let customerId: string;

    const existingCustomers = await stripe.customers.list({ email: params.email, limit: 1 });
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: params.email,
        metadata: { userId: params.userId, agentId: params.agentId },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "tzs",
            product_data: {
              name: `Nyumba Nearby ${params.planName} Plan`,
              description: "Monthly subscription for agent features",
            },
            unit_amount: params.amount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: {
        agentId: params.agentId,
        userId: params.userId,
        planName: params.planName,
      },
      success_url: `${baseUrl}/agent/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/agent/subscription?canceled=true`,
    });

    if (!session.url) {
      return { ok: false, error: "Failed to create checkout URL." };
    }

    return { ok: true, sessionId: session.id, url: session.url };
  } catch (error) {
    console.error("Stripe checkout failed:", error);
    return { ok: false, error: "Payment setup failed. Please try again." };
  }
}

/**
 * Handle Stripe webhook event for subscription changes.
 */
export async function handleWebhookEvent(event: Stripe.Event) {
  const stripe = getStripe();
  if (!stripe) return;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { agentId, planName } = session.metadata || {};
      if (!agentId) break;

      // Create subscription record
      const { prisma } = await import("@/lib/db/prisma");
      const stripeSubId = (session as unknown as Record<string, unknown>).subscription as string | undefined;
      await prisma.subscription.create({
        data: {
          agentId,
          planName: planName || "PRO",
          status: "ACTIVE",
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          userId: session.metadata?.userId || "",
          agentId,
          type: "SUBSCRIPTION",
          amount: session.amount_total || 20000,
          currency: "TZS",
          provider: "stripe",
          status: "SUCCEEDED",
        },
      });

      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const { prisma } = await import("@/lib/db/prisma");

      // Find the subscription by Stripe ID
      // Find subscription by agent from metadata
      const meta = (subscription as unknown as Record<string, unknown>).metadata as Record<string, string> | undefined;
      const agentId = meta?.agentId;
      if (!agentId) break;

      const existing = await prisma.subscription.findFirst({
        where: { agentId, status: "ACTIVE" },
      });

      if (existing) {
        const subStatus = (subscription as unknown as Record<string, unknown>).status as string;
        const periodEnd = (subscription as unknown as Record<string, unknown>).current_period_end as number | undefined;
        const status = subStatus === "active" ? "ACTIVE" :
                       subStatus === "past_due" ? "PAST_DUE" : "EXPIRED";

        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            status,
            expiresAt: periodEnd ? new Date(periodEnd * 1000) : existing.expiresAt,
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const { prisma } = await import("@/lib/db/prisma");

      const meta2 = (subscription as unknown as Record<string, unknown>).metadata as Record<string, string> | undefined;
      const agentId2 = meta2?.agentId;
      if (!agentId2) break;

      const existing = await prisma.subscription.findFirst({
        where: { agentId: agentId2, status: "ACTIVE" },
      });

      if (existing) {
        await prisma.subscription.update({
          where: { id: existing.id },
          data: { status: "CANCELLED" },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const { prisma } = await import("@/lib/db/prisma");

      // Find subscription by customer
      const invoiceMeta = (invoice as unknown as Record<string, unknown>).metadata as Record<string, string> | undefined;
      const invoiceAgentId = invoiceMeta?.agentId;
      const sub = invoiceAgentId ? await prisma.subscription.findFirst({
        where: { agentId: invoiceAgentId, status: { not: "CANCELLED" } },
      }) : null;

      if (sub) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "PAST_DUE" },
        });
      }
      break;
    }
  }
}

/**
 * Create a customer portal session for managing subscription.
 */
export async function createPortalSession(customerId: string): Promise<{ url: string } | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/agent/subscription`,
    });
    return { url: session.url };
  } catch {
    return null;
  }
}
