import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Admin only." }, { status: 403 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { property: { area: { contains: q, mode: "insensitive" } } },
    ];
  }

  const listings = await prisma.listing.findMany({
    where,
    include: {
      property: { select: { area: true } },
      agent: { select: { businessName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    data: listings.map((l) => ({
      id: l.id,
      title: l.title,
      propertyType: l.propertyType,
      status: l.status,
      verificationStatus: l.verificationStatus,
      rentAmount: l.rentAmount,
      area: l.property.area,
      agentName: l.agent.businessName,
      createdAt: l.createdAt,
    })),
  });
}
