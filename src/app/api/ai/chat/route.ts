import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })),
});

const SYSTEM_PROMPT = `You are a helpful student housing assistant for Arusha, Tanzania called "Nyumba Nearby". You help students find rooms and housing.

You can:
- Search for listings by area, price, type, and amenities
- Answer questions about rental prices in different areas
- Help students understand the rental process
- Translate between Swahili and English

Common areas: Njiro, Olorien, Sakina, Usa River, Tengeru, Moivaro
Common property types: Self-contained, Private room, One bedroom, Single room, Studio, Apartment
Prices are in Tanzanian Shillings (TZS) per month.

Rules:
- Be helpful and friendly
- Respond in the same language the student uses (Swahili or English)
- If the student describes what they want, suggest 2-3 matching listings
- Always include the price and area when suggesting listings
- If you don't have enough info, ask clarifying questions
- Never make up listings — only reference real ones from the database
- Keep responses concise (2-4 sentences max)

When suggesting listings, format them as:
**[Title]**
[Area] · [Type]
TZS [Price]/mo
[Link: /listings/[id]]`;

/** POST — chat with AI assistant */
export async function POST(request: Request) {
  const session = await auth();

  const parsed = chatSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message format." }, { status: 400 });
  }

  const { messages } = parsed.data;
  if (messages.length === 0) {
    return NextResponse.json({ error: "At least one message required." }, { status: 400 });
  }

  // Get the latest user message
  const lastUserMessage = messages[messages.length - 1];
  if (lastUserMessage.role !== "user") {
    return NextResponse.json({ error: "Last message must be from user." }, { status: 400 });
  }

  // Extract search intent from the user's message
  const searchFilters = extractFilters(lastUserMessage.content);

  // Find matching listings
  let listings: Array<{
    id: string;
    title: string;
    propertyType: string;
    rentAmount: number;
    area: string;
    image: string;
  }> = [];

  try {
    const where: Record<string, unknown> = { status: "ACTIVE" };
    if (searchFilters.area) {
      where.property = { area: { contains: searchFilters.area, mode: "insensitive" } };
    }
    if (searchFilters.propertyType) {
      where.propertyType = searchFilters.propertyType;
    }
    if (searchFilters.maxPrice) {
      where.rentAmount = { lte: searchFilters.maxPrice };
    }
    if (searchFilters.minPrice) {
      where.rentAmount = { ...(where.rentAmount as Record<string, number>), gte: searchFilters.minPrice };
    }

    const results = await prisma.listing.findMany({
      where,
      include: {
        property: { select: { area: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      take: 3,
      orderBy: { publishedAt: "desc" },
    });

    listings = results.map((l) => ({
      id: l.id,
      title: l.title,
      propertyType: l.propertyType,
      rentAmount: l.rentAmount,
      area: l.property.area,
      image: l.images[0]?.url ?? "",
    }));
  } catch (error) {
    console.error("Chat search failed:", error);
  }

  // Build context with listings
  const listingsContext = listings.length > 0
    ? `\n\nHere are some matching listings from the database:\n${listings.map((l) => `- ${l.title} | ${l.area} | ${l.propertyType} | TZS ${l.rentAmount}/mo | ID: ${l.id}`).join("\n")}`
    : "\n\nNo matching listings found in the database right now.";

  // Try AI completion (fall back to template response)
  let aiResponse: string;

  try {
    // Check if AI provider is configured
    const openaiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!openaiKey) {
      aiResponse = generateTemplateResponse(lastUserMessage.content, listings);
    } else {
      const provider = process.env.OPENAI_API_KEY ? "openai" : "openrouter";
      const baseUrl = provider === "openai" ? "https://api.openai.com/v1" : "https://openrouter.ai/api/v1";
      const model = provider === "openai" ? "gpt-4o-mini" : "openai/gpt-4o-mini";

      const apiMessages = [
        { role: "system", content: SYSTEM_PROMPT + listingsContext },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: apiMessages,
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) throw new Error("AI API failed");
      const data = await response.json();
      aiResponse = data.choices?.[0]?.message?.content ?? generateTemplateResponse(lastUserMessage.content, listings);

      // Log AI interaction
      if (session?.user) {
        try {
          await prisma.aIInteraction.create({
            data: {
              userId: session.user.id,
              type: "CHATBOT",
              input: lastUserMessage.content,
              output: aiResponse,
              provider,
              model,
              tokensUsed: data.usage?.total_tokens,
            },
          });
        } catch {
          // Don't fail on logging errors
        }
      }
    }
  } catch {
    aiResponse = generateTemplateResponse(lastUserMessage.content, listings);
  }

  return NextResponse.json({
    data: {
      role: "assistant",
      content: aiResponse,
      listings,
    },
  });
}

function extractFilters(query: string) {
  const lower = query.toLowerCase();
  const filters: {
    area?: string;
    propertyType?: string;
    maxPrice?: number;
    minPrice?: number;
  } = {};

  // Area detection
  const areas = ["njiro", "olorien", "sakina", "usa river", "tengeru", "moivaro"];
  for (const area of areas) {
    if (lower.includes(area)) {
      filters.area = area.charAt(0).toUpperCase() + area.slice(1);
      break;
    }
  }

  // Property type detection
  const types: Record<string, string> = {
    "self": "Self-contained",
    "self-contained": "Self-contained",
    "self contained": "Self-contained",
    "private": "Private room",
    "private room": "Private room",
    "one bedroom": "One bedroom",
    "single": "Single room",
    "single room": "Single room",
    "studio": "Studio",
    "apartment": "Apartment",
  };
  for (const [key, value] of Object.entries(types)) {
    if (lower.includes(key)) {
      filters.propertyType = value;
      break;
    }
  }

  // Price detection
  const priceMatch = lower.match(/(\d+)\s*k/);
  if (priceMatch) {
    filters.maxPrice = parseInt(priceMatch[1]) * 1000;
  }
  const fullPriceMatch = lower.match(/(\d{4,})/);
  if (fullPriceMatch && !priceMatch) {
    filters.maxPrice = parseInt(fullPriceMatch[1]);
  }

  return filters;
}

function generateTemplateResponse(query: string, listings: Array<{ id: string; title: string; area: string; propertyType: string; rentAmount: number }>): string {
  const lower = query.toLowerCase();

  // Greeting
  if (lower.match(/^(hi|hello|hey|habari|jambo|mambo)/)) {
    return "Habari! I'm your housing assistant. Tell me what you're looking for — area, budget, room type — and I'll help you find the perfect room in Arusha.\n\nFor example: \"Njiro, self-contained, under 150k\"";
  }

  // Help
  if (lower.includes("help") || lower.includes("msaada")) {
    return "I can help you find housing in Arusha! Try telling me:\n\n**Area**: Njiro, Olorien, Sakina, etc.\n**Budget**: \"under 150k\" or \"100k-200k\"\n**Type**: self-contained, private room, studio, etc.\n\nExample: \"Njiro, self-contained, 150k\"";
  }

  // Listings found
  if (listings.length > 0) {
    const listingText = listings.map((l) =>
      `**${l.title}**\n${l.area} · ${l.propertyType}\nTZS ${l.rentAmount.toLocaleString()}/mo\n/listings/${l.id}`
    ).join("\n\n");

    return `Here are some options I found:\n\n${listingText}\n\nWould you like to know more about any of these? Or tell me other criteria and I'll search again.`;
  }

  // No listings found
  return "I couldn't find exact matches right now. Try:\n\n- Different area (Njiro, Olorien, Sakina)\n- Higher budget\n- Different room type\n\nOr browse all listings at /search";
}
