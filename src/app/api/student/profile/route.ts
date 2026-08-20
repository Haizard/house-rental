import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

const patchSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  universityId: z.string().uuid().nullable().optional(),
  budgetMin: z.number().int().nonnegative().nullable().optional(),
  budgetMax: z.number().int().nonnegative().nullable().optional(),
  preferredArea: z.string().trim().max(100).nullable().optional(),
  moveInDate: z.string().date().nullable().optional(),
  roomType: z.string().trim().max(50).nullable().optional(),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "STUDENT")
    return NextResponse.json({ error: "Students only." }, { status: 403 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: issues }, { status: 400 });
  }

  const d = parsed.data;

  // Update user name fields if provided
  if (d.firstName || d.lastName) {
    const userUpdate: Record<string, string> = {};
    if (d.firstName) userUpdate.firstName = d.firstName;
    if (d.lastName) userUpdate.lastName = d.lastName;
    await prisma.user.update({
      where: { id: session.user.id },
      data: userUpdate,
    });
  }

  // Ensure profile exists
  let profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    profile = await prisma.studentProfile.create({
      data: { userId: session.user.id },
      select: { id: true },
    });
  }

  // Update profile fields
  const profileData: Record<string, unknown> = {};
  if (d.universityId !== undefined) profileData.universityId = d.universityId;
  if (d.budgetMin !== undefined) profileData.budgetMin = d.budgetMin;
  if (d.budgetMax !== undefined) profileData.budgetMax = d.budgetMax;
  if (d.preferredArea !== undefined) profileData.preferredArea = d.preferredArea;
  if (d.moveInDate !== undefined)
    profileData.moveInDate = d.moveInDate ? new Date(d.moveInDate) : null;
  if (d.roomType !== undefined) profileData.roomType = d.roomType;

  if (Object.keys(profileData).length > 0) {
    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: profileData,
    });
  }

  return NextResponse.json({ ok: true });
}
