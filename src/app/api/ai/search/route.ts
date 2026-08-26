import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { aiChat } from "@/lib/ai/ai-service";
import {
  housingSearchSchema,
  housingSearchSystemPrompt,
  buildHousingSearchUserMessage,
  type HousingSearchFilters,
} from "@/lib/ai/schemas/housing-search";

const requestSchema = z.object({
  query: z.string().trim().min(2).max(500),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a search query (at least 2 characters)." },
      { status: 400 },
    );
  }

  const { query } = parsed.data;

  // Step 1: Extract structured filters from natural language
  let filters: HousingSearchFilters;
  try {
    const { text } = await aiChat({
      messages: [
        { role: "system", content: housingSearchSystemPrompt },
        { role: "user", content: buildHousingSearchUserMessage(query) },
      ],
      temperature: 0.1,
      maxTokens: 512,
    });

    // Parse and validate AI output — never trust raw AI
    console.log("AI response text:", text);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not understand the search query. Try rephrasing." },
        { status: 422 },
      );
    }

    // Convert snake_case keys to camelCase (DeepSeek sometimes uses snake_case)
    let parsed = JSON.parse(jsonMatch[0]);
    if (parsed.property_type !== undefined) {
      parsed = {
        area: parsed.area,
        propertyType: parsed.property_type,
        minPrice: parsed.min_price,
        maxPrice: parsed.max_price,
        selfContained: parsed.self_contained ?? parsed.furnished,
        internet: parsed.internet ?? parsed.near_university,
        availableMonth: parsed.available_month,
        summary: parsed.summary ?? `Found listings for ${parsed.area || "your search"}`,
      };
    }
    // Ensure summary exists
    if (!parsed.summary) {
      parsed.summary = `Found listings for ${parsed.area || "your search"}`;
    }
    const validated = housingSearchSchema.safeParse(parsed);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Could not parse search criteria. Try being more specific." },
        { status: 422 },
      );
    }
    filters = validated.data;
  } catch (error) {
    console.warn("AI search extraction failed:", error);
    return NextResponse.json(
      { error: "AI search is temporarily unavailable. Try using the filter buttons instead." },
      { status: 503 },
    );
  }

  // Step 2: Query the real database — AI never invents listings
  const where: Record<string, unknown> = {
    status: "ACTIVE",
  };

  if (filters.area) {
    where.property = { area: { contains: filters.area, mode: "insensitive" } };
  }
  if (filters.propertyType) {
    where.propertyType = filters.propertyType;
  }
  if (filters.minPrice || filters.maxPrice) {
    where.rentAmount = {};
    if (filters.minPrice) (where.rentAmount as Record<string, number>).gte = filters.minPrice;
    if (filters.maxPrice) (where.rentAmount as Record<string, number>).lte = filters.maxPrice;
  }

  const listings = await prisma.listing.findMany({
    where,
    include: {
      property: { select: { area: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { publishedAt: "desc" },
    take: 24,
  });

  // Step 3: Log the AI interaction for auditing
  try {
    await prisma.$executeRaw`
      INSERT INTO ai_interactions (id, type, input, output, provider, model, tokens_used, metadata, created_at)
      VALUES (gen_random_uuid(), 'HOUSING_SEARCH', ${query}, ${JSON.stringify(filters)}, 'bedrock', 'deepseek.v3.2', 0, ${JSON.stringify({ resultCount: listings.length })}::jsonb, NOW())
    `;
  } catch {
    // Audit log failure is non-critical
  }

  return NextResponse.json({
    filters,
    listings: listings.map((l) => ({
      id: l.id,
      title: l.title,
      type: l.propertyType,
      area: l.property.area,
      price: l.rentAmount,
      image: l.images[0]?.url ?? "/listing-placeholder.svg",
      verified:
        l.verificationStatus === "VERIFIED" ||
        l.verificationStatus === "PROPERTY_VERIFIED" ||
        l.verificationStatus === "OWNER_VERIFIED",
      agentId: l.agentId,
    })),
    summary: filters.summary,
  });
}
