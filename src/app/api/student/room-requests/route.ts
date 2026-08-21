import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

const createSchema = z.object({
  title: z.string().trim().min(5).max(200),
  description: z.string().trim().max(2000).optional(),
  area: z.string().trim().min(1).max(100),
  propertyType: z.string().trim().max(50).optional(),
  rentMin: z.number().int().nonnegative().optional(),
  rentMax: z.number().int().positive().optional(),
  roomType: z.string().trim().max(50).optional(),
  amenities: z.array(z.string()).optional(),
  moveInDate: z.string().optional().nullable(),
});

/** POST /api/student/room-requests — Create a new room request */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "STUDENT")
    return NextResponse.json({ error: "Only students can post room requests." }, { status: 403 });

  const student = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!student)
    return NextResponse.json({ error: "Student profile not found." }, { status: 404 });

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  const d = parsed.data;

  const roomRequest = await prisma.roomRequest.create({
    data: {
      studentId: student.id,
      title: d.title,
      description: d.description,
      area: d.area,
      propertyType: d.propertyType,
      rentMin: d.rentMin,
      rentMax: d.rentMax,
      roomType: d.roomType,
      amenities: d.amenities ?? [],
      moveInDate: d.moveInDate ? new Date(d.moveInDate) : null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ data: roomRequest }, { status: 201 });
}

/** GET /api/student/room-requests — List student's own room requests */
export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const student = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!student)
    return NextResponse.json({ data: [] });

  const requests = await prisma.roomRequest.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    include: {
      responses: {
        select: { id: true, status: true, agent: { select: { businessName: true } } },
      },
    },
  });

  return NextResponse.json({ data: requests });
}
