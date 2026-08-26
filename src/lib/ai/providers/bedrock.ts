/**
 * AWS Bedrock LLM Engine
 * Generic — works with DeepSeek, Claude, Llama, Mistral, or any Bedrock model.
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

// --- Configuration from environment (lazy-loaded) ---
// Read process.env at CALL TIME, not module-init time.
// This ensures dotenv / env loading happens before reads.

function getBedrockRegion(): string {
  return process.env.AWS_BEDROCK_REGION || "us-east-1";
}

function getBedrockModelId(): string {
  return process.env.AWS_BEDROCK_MODEL_ID || "deepseek.v3.2";
}

let client: BedrockRuntimeClient | null = null;
let cachedRegion: string = "";

function getClient(): BedrockRuntimeClient {
  const region = getBedrockRegion();
  // Recreate client if region changed (handles late env loading)
  if (!client || cachedRegion !== region) {
    client = new BedrockRuntimeClient({ region });
    cachedRegion = region;
  }
  return client;
}

// --- Types ---

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  /** Cleaned text (JSON blocks stripped by default) */
  text: string;
  /** Raw response before any stripping */
  rawText: string;
  /** If the model generated a JSON block with structured data */
  jsonData?: Record<string, unknown>;
}

export interface ChatOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  /** Custom system prompt — overrides the default */
  systemPrompt?: string;
  /** If true, keep JSON code blocks in the returned text */
  keepJson?: boolean;
}

// --- Main Chat Function ---

export async function bedrockChat(
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<ChatResponse> {
  const bedrock = getClient();

  const systemContent = options?.systemPrompt || "You are a helpful assistant.";

  // Build messages array for the model.
  // DeepSeek V3.2 on Bedrock may not support the 'system' role in messages,
  // so we include the system prompt as the first user message as a fallback.
  const chatMessages = [
    { role: "system" as const, content: systemContent },
    { role: "user" as const, content: `[SYSTEM INSTRUCTIONS — follow these rules exactly]\n\n${systemContent}` },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const inputBody = JSON.stringify({
    messages: chatMessages,
    max_tokens: options?.maxTokens || 4096,
    temperature: options?.temperature ?? 0.3,
    top_p: options?.topP ?? 0.85,
  });

  const command = new InvokeModelCommand({
    modelId: getBedrockModelId(),
    contentType: "application/json",
    accept: "application/json",
    body: new TextEncoder().encode(inputBody),
  });

  const response = await bedrock.send(command);
  const responseBody = JSON.parse(
    new TextDecoder().decode(response.body)
  );

  // Extract text from various model response formats:
  let text = "";

  if (responseBody.choices?.[0]?.message?.content) {
    // DeepSeek / OpenAI-style chat response
    text = responseBody.choices[0].message.content;
  } else if (responseBody.choices?.[0]?.text) {
    // Older completion-style response
    text = responseBody.choices[0].text;
  } else if (responseBody.content?.[0]?.text) {
    // Anthropic Claude response
    text = responseBody.content[0].text;
  } else if (responseBody.generation) {
    // Legacy generation format
    text = responseBody.generation;
  } else if (responseBody.completions?.[0]?.data?.text) {
    // Older completions format
    text = responseBody.completions[0].data.text;
  } else if (typeof responseBody.output === "string") {
    text = responseBody.output;
  } else if (responseBody.output?.text) {
    text = responseBody.output.text;
  } else {
    // Fallback: stringify whatever we got
    text = JSON.stringify(responseBody);
  }

  const rawText = text;

  // Try to extract a JSON block from the response
  let jsonData: Record<string, unknown> | undefined;
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      jsonData = JSON.parse(jsonMatch[1]);
    } catch {
      // Not valid JSON — ignore
    }
  }

  // Strip JSON blocks from visible text (unless keepJson is set)
  let visibleText = text;
  if (!options?.keepJson) {
    visibleText = text.replace(/```json[\s\S]*?```/g, "").trim();
    visibleText = visibleText.replace(/\n{3,}/g, "\n\n").trim();
  }

  return { text: visibleText, rawText, jsonData };
}

// --- Helpers ---

/** Check if Bedrock is configured */
export function isBedrockConfigured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_PROFILE ||
    process.env.AWS_BEDROCK_REGION
  );
}

/** Get current config (non-sensitive) */
export function getBedrockConfig() {
  return {
    region: getBedrockRegion(),
    modelId: getBedrockModelId(),
    configured: isBedrockConfigured(),
  };
}
