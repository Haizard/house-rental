import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const translateSchema = z.object({
  text: z.string().min(1).max(2000),
  targetLang: z.enum(["en", "sw"]),
});

const SYSTEM_PROMPT = `You are a translator for a Tanzanian student housing marketplace.
Translate the given text between English and Swahili.
Rules:
- Keep property terms accurate (self-contained, single room, etc.)
- Keep numbers and prices as-is
- Keep location names as-is (Njiro, Olorien, etc.)
- Be concise and natural
- Return ONLY the translated text, nothing else`;

/** POST — translate text */
export async function POST(request: Request) {
  const parsed = translateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { text, targetLang } = parsed.data;

  // Detect language (simple heuristic)
  const swahiliWords = ["na", "ya", "kwa", "ni", "kuna", "chumba", "nyumba", "jumba", "maji", "umeme", "laki", "karibu"];
  const words = text.toLowerCase().split(/\s+/);
  const swahiliCount = words.filter((w) => swahiliWords.includes(w)).length;
  const sourceLang = swahiliCount >= 2 ? "sw" : "en";

  if (sourceLang === targetLang) {
    return NextResponse.json({ data: { translated: text, sourceLang, targetLang } });
  }

  // Try AI translation
  try {
    const openaiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({
        data: {
          translated: text,
          sourceLang,
          targetLang,
          note: "AI translation not configured",
        },
      });
    }

    const provider = process.env.OPENAI_API_KEY ? "openai" : "openrouter";
    const baseUrl = provider === "openai" ? "https://api.openai.com/v1" : "https://openrouter.ai/api/v1";
    const model = provider === "openai" ? "gpt-4o-mini" : "openai/gpt-4o-mini";

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Translate to ${targetLang === "en" ? "English" : "Swahili"}:\n\n${text}` },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) throw new Error("Translation API failed");
    const data = await response.json();
    const translated = data.choices?.[0]?.message?.content ?? text;

    return NextResponse.json({
      data: { translated, sourceLang, targetLang },
    });
  } catch (error) {
    console.error("Translation failed:", error);
    return NextResponse.json({
      data: { translated: text, sourceLang, targetLang, note: "Translation temporarily unavailable" },
    });
  }
}
