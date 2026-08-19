import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

const resolutionSchema = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"]),
  resolution: z.string().trim().min(1).max(2000),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in to resolve reports." }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Only admins can resolve reports." }, { status: 403 });

  const parsed = resolutionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Add a resolution before closing this report." }, { status: 400 });
  const { id } = await params;
  const report = await prisma.report.findFirst({ where: { id, status: "OPEN" }, select: { id: true } });
  if (!report) return NextResponse.json({ error: "Open report not found." }, { status: 404 });

  const updated = await prisma.report.update({ where: { id: report.id }, data: { status: parsed.data.status, resolution: parsed.data.resolution, updatedAt: new Date() }, select: { id: true, status: true } });
  return NextResponse.json({ data: updated });
}
