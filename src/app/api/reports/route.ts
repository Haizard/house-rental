import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

const reportSchema = z.object({
  targetType: z.enum(["LISTING", "AGENT", "USER", "MESSAGE"]),
  targetId: z.string().min(1),
  reason: z.enum([
    "INACCURATE", "SCAM", "DUPLICATE", "HARASSMENT", "OTHER",
    "FAKE_LISTING", "WRONG_PRICE", "UNRESPONSIVE", "INAPPROPRIATE",
  ]),
  description: z.string().trim().max(2000).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in to report this." }, { status: 401 });
  const parsed = reportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a reason for your report." }, { status: 400 });

  const existing = await prisma.report.findFirst({ where: { reporterId: session.user.id, targetType: parsed.data.targetType, targetId: parsed.data.targetId, status: "OPEN" }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "You already have an open report for this." }, { status: 409 });

  const report = await prisma.report.create({ data: { reporterId: session.user.id, ...parsed.data } });
  return NextResponse.json({ data: { id: report.id, status: report.status } }, { status: 201 });
}
