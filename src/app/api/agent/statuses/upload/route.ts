import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { storageService } from "@/lib/storage/supabase-storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT")
    return NextResponse.json({ error: "Only agents." }, { status: 403 });

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file)
    return NextResponse.json({ error: "No file provided." }, { status: 400 });

  if (file.size > MAX_FILE_SIZE)
    return NextResponse.json({ error: "File must be smaller than 5 MB." }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, and AVIF images are allowed." }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const storagePath = `statuses/${agent.id}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const result = await storageService.upload({
    bucket: "listing-images", // reuse same bucket
    path: storagePath,
    contentType: file.type,
    body: arrayBuffer,
  });

  if (!result.ok)
    return NextResponse.json({ error: result.error }, { status: 500 });

  return NextResponse.json({ url: result.url }, { status: 201 });
}
