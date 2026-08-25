import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: listingId } = await params;
  const url = new URL(request.url);
  const dateStr = url.searchParams.get("date");

  if (!dateStr) {
    return NextResponse.json({ error: "date parameter required (YYYY-MM-DD)." }, { status: 400 });
  }

  const date = new Date(dateStr + "T00:00:00.000Z");
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  // Find existing viewing requests for this listing on this date
  const existingViewings = await prisma.viewingRequest.findMany({
    where: {
      listingId,
      scheduledAt: { gte: date, lt: nextDay },
      status: { in: ["REQUESTED", "ACCEPTED"] },
    },
    select: { scheduledAt: true },
  });

  // Build taken hours set
  const takenHours = new Set<string>();
  for (const v of existingViewings) {
    if (v.scheduledAt) {
      const h = v.scheduledAt.getUTCHours().toString().padStart(2, "0");
      takenHours.add(`${h}:00`);
    }
  }

  const slots = HOURS.map((time) => ({
    time,
    available: !takenHours.has(time),
  }));

  return NextResponse.json({ slots });
}
