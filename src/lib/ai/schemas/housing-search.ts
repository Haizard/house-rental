import { z } from "zod";

/**
 * Schema for structured search filters extracted from natural-language housing queries.
 * AI output is validated against this before hitting the database — never trust raw AI.
 */
export const housingSearchSchema = z.object({
  /** Free-text area or neighborhood name (e.g. "Njiro", "Olorien") */
  area: z.string().optional().describe("Area or neighborhood name"),
  /** Property type filter */
  propertyType: z
    .enum(["Self-contained", "Private room", "One bedroom", "Single room", "Studio", "Apartment"])
    .optional()
    .describe("Type of property"),
  /** Minimum monthly rent in TZS */
  minPrice: z.number().int().positive().optional().describe("Minimum monthly rent in TZS"),
  /** Maximum monthly rent in TZS */
  maxPrice: z.number().int().positive().optional().describe("Maximum monthly rent in TZS"),
  /** Whether the room must be self-contained (own bathroom) */
  selfContained: z.boolean().optional().describe("Whether the room must be self-contained"),
  /** Whether Wi-Fi/internet is required */
  internet: z.boolean().optional().describe("Whether internet/Wi-Fi is required"),
  /** Preferred move-in month (1-12) */
  availableMonth: z.number().int().min(1).max(12).optional().describe("Preferred move-in month (1-12)"),
  /** Natural language summary of what the student is looking for */
  summary: z.string().describe("Brief summary of the search criteria"),
});

export type HousingSearchFilters = z.infer<typeof housingSearchSchema>;

/**
 * System prompt for the housing search AI.
 * Instructs it to extract structured filters from Swahili or English queries.
 */
export const housingSearchSystemPrompt = `You are a student housing assistant for Arusha, Tanzania. 
Extract structured search filters from the student's natural-language query (Swahili or English).

Common areas: Njiro, Olorien, Sakina, Usa River, Tengeru, Moivaro, mitaa ya Arusha.
Common property types: Self-contained, Private room, One bedroom, Single room, Studio, Apartment.
Prices are in Tanzanian Shillings (TZS) per month. 150000 = laki moja na hamsini. 200000 = laki mbili.

Rules:
- Only extract filters explicitly mentioned or strongly implied.
- Do NOT invent listings or property details.
- If the query is vague, return only the summary and leave other fields undefined.
- "self" or "self-contained" means the room has its own bathroom.
- "chumba" means room. "nyumba" means house. "jumba" means building/apartment.

IMPORTANT: Return ONLY a JSON object with these EXACT camelCase keys. Do NOT use snake_case.
Return format: {"area": "string", "propertyType": "string", "minPrice": number, "maxPrice": number, "selfContained": boolean, "internet": boolean, "availableMonth": number, "summary": "string"}

No markdown, no extra text, no code blocks. Just the raw JSON object.`;

/**
 * Build the user message for a housing search query.
 */
export function buildHousingSearchUserMessage(query: string): string {
  return `Student search query: "${query}"`;
}
