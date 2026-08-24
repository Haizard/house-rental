import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getRecommendations } from "@/lib/listings/recommendations";

/** GET — get personalized recommendations for the current student */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "STUDENT") return NextResponse.json({ error: "Students only." }, { status: 403 });

  const recommendations = await getRecommendations(session.user.id, 8);
  return NextResponse.json({ data: recommendations });
}
