/**
 * Unified AI Service — AWS Bedrock with fallback to OpenAI/OpenRouter.
 * Follows the multi-feature AI service pattern from the Bedrock guide.
 */

import {
  bedrockChat,
  isBedrockConfigured,
  getBedrockConfig,
  type ChatMessage as BedrockChatMessage,
} from "./providers/bedrock";

// Re-export ChatMessage with system role support for internal use
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface AIService {
  chat(params: { messages: ChatMessage[]; temperature?: number; maxTokens?: number; model?: string }): Promise<{ text: string; tokensUsed: number }>;
}

export interface AIServiceResponse {
  text: string;
  tokensUsed: number;
  engine: "bedrock" | "openai" | "rule-based";
}

/** Safe wrapper — returns fallback if Bedrock is down */
async function askBedrock(
  messages: BedrockChatMessage[],
  fallbackContext: string,
  options?: { temperature?: number; maxTokens?: number; systemPrompt?: string }
): Promise<string> {
  if (!isBedrockConfigured()) {
    return `[AI unavailable — Bedrock not configured] ${fallbackContext}`;
  }
  try {
    // Handle system messages by prepending to first user message
    // (DeepSeek may not support system role in messages array)
    const systemMsg = messages.find((m) => m.role === "system");
    const userMsgs = messages.filter((m) => m.role !== "system");
    const firstUser = userMsgs[0];
    if (systemMsg && firstUser) {
      userMsgs[0] = {
        role: "user",
        content: `${systemMsg.content}\n\n---\n\nUser data:\n${firstUser.content}`,
      };
    }
    const response = await bedrockChat(
      userMsgs.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      {
        temperature: options?.temperature ?? 0.3,
        maxTokens: options?.maxTokens ?? 4096,
        systemPrompt: options?.systemPrompt,
      }
    );
    return response.text;
  } catch (err) {
    console.error("AI call failed:", err);
    return `[AI analysis failed] ${fallbackContext}`;
  }
}

/**
 * Main AI chat function — tries Bedrock first, falls back gracefully.
 */
export async function aiChat(params: {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}): Promise<AIServiceResponse> {
  const { messages, temperature, maxTokens, systemPrompt } = params;

  // Try Bedrock first
  if (isBedrockConfigured()) {
    try {
      const text = await askBedrock(messages, "Bedrock unavailable", {
        temperature,
        maxTokens,
        systemPrompt,
      });
      return { text, tokensUsed: 0, engine: "bedrock" };
    } catch (err) {
      console.error("Bedrock failed, falling back:", err);
    }
  }

  // Fallback to OpenAI/OpenRouter if configured
  try {
    const { aiService: openaiService } = await import("./providers/openai") as { aiService: { chat(params: { messages: { role: string; content: string }[]; temperature?: number; maxTokens?: number }): Promise<{ text: string; tokensUsed: number }> } };
    const { text, tokensUsed } = await openaiService.chat({
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature,
      maxTokens,
    });
    return { text, tokensUsed, engine: "openai" };
  } catch {
    // No provider available
  }

  return {
    text: "[AI not configured] Please set AWS Bedrock or OpenAI credentials.",
    tokensUsed: 0,
    engine: "rule-based",
  };
}

/**
 * Check if any AI provider is available.
 */
export function isAIConfigured(): boolean {
  return isBedrockConfigured() || !!process.env.OPENAI_API_KEY || !!process.env.OPENROUTER_API_KEY;
}

/**
 * Get AI configuration status.
 */
export function getAIConfig() {
  return {
    bedrock: getBedrockConfig(),
    openai: {
      configured: !!(process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY),
    },
    anyConfigured: isAIConfigured(),
  };
}
