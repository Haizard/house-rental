import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

const patchSchema = z.object({
  businessName: z.string().trim().min(1).max(100).optional(),
  bio: z.string().trim().max(500).optional(),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT")
    return NextResponse.json({ error: "Agents only." }, { status: 403 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: issues }, { status: 400 });
  }

  const d = parsed.data;

  // Update user name if provided
  if (d.firstName || d.lastName) {
    const userUpdate: Record<string, string> = {};
    if (d.firstName) userUpdate.firstName = d.firstName;
    if (d.lastName) userUpdate.lastName = d.lastName;
    await prisma.user.update({
      where: { id: session.user.id },
      data: userUpdate,
    });
  }

  // Update agent profile
  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  const profileData: Record<string, string> = {};
  if (d.businessName) profileData.businessName = d.businessName;
  if (d.bio !== undefined) profileData.bio = d.bio;

  if (Object.keys(profileData).length > 0) {
    await prisma.agentProfile.update({
      where: { id: agent.id },
      data: profileData,
    });
  }

  return NextResponse.json({ ok: true });
}
