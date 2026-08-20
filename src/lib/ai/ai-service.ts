import type { ChatMessage } from "./providers/openai";

export type AIRole = "system" | "user" | "assistant";

export interface AIService {
  /** Send a chat completion request and return the assistant's text response. */
  chat(params: {
    messages: ChatMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ text: string; tokensUsed: number }>;
}

/** Thrown when no AI provider is configured. */
export class AIProviderMissingError extends Error {
  constructor() {
    super("No AI provider is configured. Set OPENAI_API_KEY or OPENROUTER_API_KEY.");
  }
}
