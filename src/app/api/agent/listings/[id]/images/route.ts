import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";
import { storageService } from "@/lib/storage/supabase-storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_IMAGES = 12;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT")
    return NextResponse.json({ error: "Only agents can upload images." }, { status: 403 });

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  const { id } = await params;
  const listing = await prisma.listing.findFirst({
    where: { id, agentId: agent.id },
    select: { id: true },
  });
  if (!listing)
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  // Check image count limit
  const existingCount = await prisma.listingImage.count({
    where: { listingId: listing.id },
  });
  if (existingCount >= MAX_IMAGES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_IMAGES} images per listing.` },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File must be smaller than 5 MB." },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, and AVIF images are allowed." },
      { status: 400 },
    );
  }

  // Optimize image before upload
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  let uploadBuffer: Buffer = inputBuffer;
  let uploadContentType: string = file.type;
  let storagePath: string;

  try {
    const { optimizeImage, validateImage } = await import("@/lib/storage/image-optimizer");
    const validation = validateImage(file.type, file.size);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const optimized = await optimizeImage(inputBuffer, file.name);
    // Use the medium size for upload (best balance of quality/size)
    const mediumSize = optimized.find((o) => o.size === "medium") || optimized[0];
    uploadBuffer = mediumSize.buffer;
    uploadContentType = mediumSize.contentType;

    const ext = mediumSize.suffix.split(".").pop() ?? "webp";
    storagePath = `listings/${listing.id}/${crypto.randomUUID()}.${ext}`;
  } catch {
    // Fallback: upload original
    const ext = file.name.split(".").pop() ?? "jpg";
    storagePath = `listings/${listing.id}/${crypto.randomUUID()}.${ext}`;
    uploadContentType = file.type;
  }

  const result = await storageService.upload({
    bucket: "listing-images",
    path: storagePath,
    contentType: uploadContentType,
    body: uploadBuffer.buffer.slice(0) as ArrayBuffer,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Create DB record
  const isFirst = existingCount === 0;
  const image = await prisma.listingImage.create({
    data: {
      listingId: listing.id,
      url: result.url,
      storageKey: result.storageKey,
      sortOrder: existingCount,
      isPrimary: isFirst,
    },
    select: { id: true, url: true, sortOrder: true, isPrimary: true },
  });

  return NextResponse.json({ data: image }, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT")
    return NextResponse.json({ error: "Only agents can delete images." }, { status: 403 });

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  const { id } = await params;
  const { imageId } = await request.json().catch(() => ({ imageId: null }));
  if (!imageId) {
    return NextResponse.json({ error: "imageId is required." }, { status: 400 });
  }

  const image = await prisma.listingImage.findFirst({
    where: { id: imageId, listing: { agentId: agent.id } },
    select: { id: true, storageKey: true },
  });
  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  await storageService.delete(image.storageKey);
  await prisma.listingImage.delete({ where: { id: image.id } });

  return NextResponse.json({ deleted: true });
}
