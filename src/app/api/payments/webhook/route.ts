import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { handleWebhookEvent } from "@/lib/payments/stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-07-29.dahlia",
});

/** POST — handle Stripe webhook */
export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    await handleWebhookEvent(event);
  } catch (error) {
    console.error("Webhook handler failed:", error);
    // Return 200 to prevent Stripe from retrying
  }

  return NextResponse.json({ received: true });
}
