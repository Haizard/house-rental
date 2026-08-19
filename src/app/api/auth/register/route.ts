import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const registrationSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
});

export async function POST(request: Request) {
  const parsed = registrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid name, email, and password." }, { status: 400 });
  }

  const existingUser = await prisma.user.findFirst({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existingUser) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash: await hash(parsed.data.password, 12),
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      role: "STUDENT",
      studentProfile: { create: {} },
    },
    select: { id: true, email: true },
  });

  return NextResponse.json({ data: user }, { status: 201 });
}
