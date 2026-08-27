import type { AIService } from "../ai-service";
// Note: AIService is defined in ai-service.ts

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * OpenAI-compatible provider. Works with OpenAI, OpenRouter, or any
 * compatible API endpoint. Reads config once at module load per docs §5.
 */
class OpenAIProvider implements AIService {
  private baseUrl: string;
  private apiKey: string;
  private defaultModel: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY or OPENROUTER_API_KEY must be set.");

    // OpenRouter uses a different base URL
    if (process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
      this.baseUrl = "https://openrouter.ai/api/v1";
    } else {
      this.baseUrl = process.env.AI_BASE_URL ?? "https://api.openai.com/v1";
    }

    this.apiKey = apiKey;
    this.defaultModel = process.env.AI_MODEL ?? "gpt-4o-mini";
  }

  async chat({
    messages,
    model,
    temperature = 0.3,
    maxTokens = 1024,
  }: {
    messages: ChatMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ text: string; tokensUsed: number }> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: model ?? this.defaultModel,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`AI request failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    const tokensUsed = data.usage?.total_tokens ?? 0;

    return { text, tokensUsed };
  }
}

function createAIService(): AIService {
  try {
    return new OpenAIProvider();
  } catch {
    // Return a stub that throws when called
    return {
      async chat() {
        throw new Error(
          "No AI provider is configured. Set OPENAI_API_KEY or OPENROUTER_API_KEY.",
        );
      },
    };
  }
}

/** Singleton AI service — configured once at module load. */
export const aiService = createAIService();
