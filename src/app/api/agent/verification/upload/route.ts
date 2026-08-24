import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { storageService } from "@/lib/storage/supabase-storage";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT") return NextResponse.json({ error: "Only agents can upload documents." }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 5MB." }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, or PDF files are accepted." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `verification/${session.user.id}/${Date.now()}.${ext}`;

    const result = await storageService.upload({
      bucket: "verification-docs",
      path,
      contentType: file.type,
      body: buffer,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Upload failed." }, { status: 500 });
    }

    return NextResponse.json({ url: result.url, storageKey: result.storageKey });
  } catch (error) {
    console.error("Verification upload failed:", error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
