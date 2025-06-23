export const PII_PATTERNS = {
    email: {
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      confidence: 0.95
    },
    phone: {
      regex: /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
      confidence: 0.9
    },
    ssn: {
      regex: /\b(?:\d{3}-?\d{2}-?\d{4}|\d{3}\s\d{2}\s\d{4})\b/g,
      confidence: 0.95
    },
    credit_card: {
      regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      confidence: 0.85
    },
    name: {
      regex: /\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b/g,
      confidence: 0.7
    },
    address: {
      regex: /\b\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Ct|Court|Way|Place|Plaza)\b/gi,
      confidence: 0.8
    }
} as const;