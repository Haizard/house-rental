import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

const prefsSchema = z.object({
  university: z.string().optional(),
  budgetMin: z.number().int().nonnegative().optional(),
  budgetMax: z.number().int().nonnegative().optional(),
  preferredArea: z.string().optional(),
  roomType: z.string().optional(),
});

/** PATCH — update student preferences */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "STUDENT") return NextResponse.json({ error: "Students only." }, { status: 403 });

  const parsed = prefsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Student profile not found." }, { status: 404 });

  // Find university by name if provided
  let universityId: string | undefined;
  if (parsed.data.university) {
    const uni = await prisma.university.findFirst({
      where: { name: { contains: parsed.data.university, mode: "insensitive" } },
      select: { id: true },
    });
    universityId = uni?.id;
  }

  const updated = await prisma.studentProfile.update({
    where: { id: profile.id },
    data: {
      ...(universityId ? { universityId } : {}),
      ...(parsed.data.budgetMin !== undefined ? { budgetMin: parsed.data.budgetMin } : {}),
      ...(parsed.data.budgetMax !== undefined ? { budgetMax: parsed.data.budgetMax } : {}),
      ...(parsed.data.preferredArea !== undefined ? { preferredArea: parsed.data.preferredArea } : {}),
      ...(parsed.data.roomType !== undefined ? { roomType: parsed.data.roomType } : {}),
    },
    select: { id: true },
  });

  return NextResponse.json({ data: updated });
}
