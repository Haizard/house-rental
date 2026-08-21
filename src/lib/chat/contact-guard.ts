/**
 * Detects phone numbers and email addresses in chat messages.
 * Used to block users from sharing contact info outside the reveal flow.
 */

// Tanzanian phone patterns: +255XXXXXXXXX, 0XXXXXXXXX, 255XXXXXXXXX
// Also covers common international formats
const PHONE_PATTERNS = [
  /\+255[\s\-]?[67]\d[\s\-]?\d{3}[\s\-]?\d{3,4}/g,       // +255 6XX XXX XXX
  /\+255[\s\-]?(?:27|22|23|26|28)\d[\s\-]?\d{3}[\s\-]?\d{3}/g, // landline
  /0[67]\d[\s\-]?\d{3}[\s\-]?\d{3,4}/g,                    // 06XX XXX XXX
  /\b255[67]\d[\s\-]?\d{3}[\s\-]?\d{3,4}/g,               // 255 6XX XXX XXX
  /\b\d{3}[\s\-]?\d{3}[\s\-]?\d{3,4}\b/g,                 // generic 9-12 digit sequences
];

const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

// Social media handles that look like contact sharing
const SOCIAL_PATTERNS = [
  /\b(?:whatsapp|telegram|instagram|facebook|twitter|x)\s*(?:me|at|is|:)\s*\S+/gi,
  /\b(?:piga|call|contact|reach|namba|number)\s*(?:me\s*)?(?:on\s*)?\+?\d/gi,
];

export type ContactGuardResult = {
  blocked: boolean;
  reason?: string;
};

/**
 * Returns a first-match reason if the message contains contact info.
 * Returns { blocked: false } if the message is clean.
 */
export function detectContactInfo(message: string): ContactGuardResult {
  const trimmed = message.trim();

  // Check for email addresses
  if (EMAIL_PATTERN.test(trimmed)) {
    return { blocked: true, reason: "Email addresses cannot be shared in chat." };
  }

  // Check for phone numbers (longer strings only to avoid false positives on short numbers)
  if (trimmed.length >= 8) {
    for (const pattern of PHONE_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match) {
        return { blocked: true, reason: "Phone numbers cannot be shared in chat. Use the Request Contact feature instead." };
      }
    }
  }

  // Check for social media contact sharing
  for (const pattern of SOCIAL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { blocked: true, reason: "Contact sharing is not allowed in chat. Use the Request Contact feature instead." };
    }
  }

  return { blocked: false };
}
