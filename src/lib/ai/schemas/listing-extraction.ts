import { z } from "zod";

/**
 * Schema for structured listing data extracted from an agent's free-text description.
 * Agent must confirm extracted data before publishing — AI never publishes automatically.
 */
export const listingExtractionSchema = z.object({
  /** Property title */
  title: z.string().min(3).describe("Short descriptive title for the listing"),
  /** Area/neighborhood */
  area: z.string().min(1).describe("Area or neighborhood in Arusha"),
  /** Property address or landmark */
  address: z.string().optional().describe("Address or nearby landmark"),
  /** Monthly rent in TZS */
  rentAmount: z.number().int().positive().describe("Monthly rent in Tanzanian Shillings"),
  /** Property type */
  propertyType: z
    .enum(["Self-contained", "Private room", "One bedroom", "Single room", "Studio", "Apartment"])
    .describe("Type of property"),
  /** Description of the property */
  description: z.string().optional().describe("Brief property description"),
  /** Whether the room is self-contained */
  selfContained: z.boolean().optional().describe("Whether the room has its own bathroom"),
  /** Water availability */
  waterAvailable: z.boolean().optional().describe("Whether water is available"),
  /** Electricity available */
  electricityAvailable: z.boolean().optional().describe("Whether electricity is available"),
  /** Internet/Wi-Fi available */
  internetAvailable: z.boolean().optional().describe("Whether internet/Wi-Fi is available"),
  /** Available month (1-12) */
  availableMonth: z.number().int().min(1).max(12).optional().describe("Month when the property becomes available (1-12)"),
  /** Confidence level of the extraction */
  confidence: z.enum(["high", "medium", "low"]).describe("How confident you are in the extraction"),
  /** Any ambiguous or missing information the agent should clarify */
  clarificationNeeded: z.array(z.string()).optional().describe("Questions or clarifications needed from the agent"),
});

export type ListingExtraction = z.infer<typeof listingExtractionSchema>;

/**
 * System prompt for listing information extraction.
 * Instructs it to extract structured data from Swahili or English free text.
 */
export const listingExtractionSystemPrompt = `You are a listing assistant for a Tanzanian student housing marketplace.
An agent will describe a property in free text (Swahili or English). Extract structured listing information.

Common Swahili terms:
- "chumba" = room, "nyumba" = house, "self" = self-contained (own bathroom)
- "maji" = water, "umeme" = electricity, "intaneti/internet" = internet
- "laki" = 100,000. "laki moja na hamsini" = 150,000. "laki mbili" = 200,000
- "karibu na chuo" = near university
- Available months: mwezi wa 1-12 (month 1-12), Januari-Desemba

Rules:
- Extract only what is explicitly stated.
- Set confidence to "high" if most fields are clear, "medium" if some are ambiguous, "low" if very vague.
- List any information that needs clarification in clarificationNeeded.
- Do NOT invent or assume property details not mentioned.
- Return a JSON object matching the schema exactly. No markdown, no extra text.`;

/**
 * Build the user message for listing extraction.
 */
export function buildListingExtractionUserMessage(description: string): string {
  return `Agent listing description: "${description}"`;
}
