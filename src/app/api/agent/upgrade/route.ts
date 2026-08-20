import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

export async function POST() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT")
    return NextResponse.json({ error: "Only agents." }, { status: 403 });

  // TODO: Integrate with payment provider (mobile money / cards)
  // For now, return a message that payment is not yet configured
  return NextResponse.json(
    {
      error:
        "Payment integration is coming soon. The Pro tier will cost TZS 20,000/month.",
      comingSoon: true,
    },
    { status: 501 },
  );
}
