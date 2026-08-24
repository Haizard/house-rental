import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

const savedSearchSchema = z.object({
  name: z.string().max(100).optional(),
  area: z.string().max(100).optional(),
  propertyType: z.string().max(50).optional(),
  minPrice: z.number().int().positive().optional(),
  maxPrice: z.number().int().positive().optional(),
  gender: z.string().max(20).optional(),
  furnished: z.boolean().optional(),
  amenities: z.array(z.string()).optional(),
});

/** GET — list saved searches */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ data: [] });

  const searches = await prisma.savedSearch.findMany({
    where: { studentId: profile.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: searches });
}

/** POST — create a saved search */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Student profile not found." }, { status: 404 });

  const parsed = savedSearchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid search filters." }, { status: 400 });
  }

  const search = await prisma.savedSearch.create({
    data: {
      studentId: profile.id,
      ...parsed.data,
      amenities: parsed.data.amenities ?? [],
    },
  });

  return NextResponse.json({ data: search }, { status: 201 });
}

/** DELETE — remove a saved search */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Student profile not found." }, { status: 404 });

  const { searchId } = await request.json().catch(() => ({}));
  if (!searchId) return NextResponse.json({ error: "searchId required." }, { status: 400 });

  await prisma.savedSearch.deleteMany({
    where: { id: searchId, studentId: profile.id },
  });

  return NextResponse.json({ ok: true });
}
