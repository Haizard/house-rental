import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";
import { storageService } from "@/lib/storage/supabase-storage";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
];
const MAX_VIDEOS = 3;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT")
    return NextResponse.json(
      { error: "Only agents can upload videos." },
      { status: 403 },
    );

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent)
    return NextResponse.json(
      { error: "Agent profile not found." },
      { status: 404 },
    );

  const { id } = await params;
  const listing = await prisma.listing.findFirst({
    where: { id, agentId: agent.id },
    select: { id: true },
  });
  if (!listing)
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  // Check video count limit
  const existingCount = await prisma.listingVideo.count({
    where: { listingId: listing.id },
  });
  if (existingCount >= MAX_VIDEOS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_VIDEOS} videos per listing.` },
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
      { error: "File must be smaller than 50 MB." },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only MP4, WebM, MOV, and AVI videos are allowed." },
      { status: 400 },
    );
  }

  // Generate storage path
  const ext = file.name.split(".").pop() ?? "mp4";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const storagePath = `listings/${listing.id}/videos/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const result = await storageService.upload({
    bucket: "listing-images", // reuse same bucket
    path: storagePath,
    contentType: file.type,
    body: arrayBuffer,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Create DB record
  const video = await prisma.listingVideo.create({
    data: {
      listingId: listing.id,
      url: result.url,
      storageKey: result.storageKey,
    },
    select: { id: true, url: true },
  });

  return NextResponse.json({ data: video }, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT")
    return NextResponse.json(
      { error: "Only agents can delete videos." },
      { status: 403 },
    );

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent)
    return NextResponse.json(
      { error: "Agent profile not found." },
      { status: 404 },
    );

  const { id } = await params;
  const url = new URL(request.url);
  const videoId = url.searchParams.get("id");
  if (!videoId) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const video = await prisma.listingVideo.findFirst({
    where: { id: videoId, listing: { agentId: agent.id } },
    select: { id: true, storageKey: true },
  });
  if (!video)
    return NextResponse.json({ error: "Video not found." }, { status: 404 });

  await storageService.delete(video.storageKey);
  await prisma.listingVideo.delete({ where: { id: video.id } });

  return NextResponse.json({ deleted: true });
}
