import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getSearchAnalytics } from "@/lib/search/analytics";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days") || "30", 10);

  const analytics = await getSearchAnalytics({ days: Math.min(days, 365) });

  return NextResponse.json({ data: analytics });
}
