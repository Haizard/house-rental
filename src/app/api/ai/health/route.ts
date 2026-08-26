import { NextResponse } from "next/server";
import { getAIConfig, aiChat } from "@/lib/ai/ai-service";

export async function GET() {
  const config = getAIConfig();

  if (!config.anyConfigured) {
    return NextResponse.json({
      ok: false,
      error: "No AI provider configured",
      config,
    });
  }

  try {
    const response = await aiChat({
      messages: [{ role: "user", content: "Reply with exactly: OK" }],
      maxTokens: 10,
      temperature: 0.1,
    });

    return NextResponse.json({
      ok: true,
      engine: response.engine,
      response: response.text.slice(0, 200),
      config,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      ok: false,
      error: message,
      config,
    });
  }
}
