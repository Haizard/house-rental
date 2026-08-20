import { NextResponse } from "next/server";
import { z } from "zod";
import { aiService } from "@/lib/ai/providers/openai";
import {
  listingExtractionSchema,
  listingExtractionSystemPrompt,
  buildListingExtractionUserMessage,
  type ListingExtraction,
} from "@/lib/ai/schemas/listing-extraction";

const requestSchema = z.object({
  description: z.string().trim().min(5).max(2000),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a listing description (at least 5 characters)." },
      { status: 400 },
    );
  }

  const { description } = parsed.data;

  let extraction: ListingExtraction;
  try {
    const { text } = await aiService.chat({
      messages: [
        { role: "system", content: listingExtractionSystemPrompt },
        { role: "user", content: buildListingExtractionUserMessage(description) },
      ],
      temperature: 0.1,
      maxTokens: 768,
    });

    // Parse and validate AI output
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not extract listing details. Try describing the property more clearly." },
        { status: 422 },
      );
    }

    const validated = listingExtractionSchema.safeParse(JSON.parse(jsonMatch[0]));
    if (!validated.success) {
      return NextResponse.json(
        { error: "Could not parse the listing details. Please fill in the form manually." },
        { status: 422 },
      );
    }
    extraction = validated.data;
  } catch (error) {
    console.warn("AI listing extraction failed:", error);
    return NextResponse.json(
      { error: "AI extraction is temporarily unavailable. Please fill in the form manually." },
      { status: 503 },
    );
  }

  return NextResponse.json({ data: extraction });
}
