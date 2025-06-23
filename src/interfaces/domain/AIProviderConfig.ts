import { PIIType } from "@/types";

export interface AIProviderConfig {
    provider: 'gemini' | 'openai';
    model: string;
    apiKey?: string;
    maxTokens?: number;
    temperature?: number;
}

export interface AIPIIResponse {
    type: PIIType;
    value: string;
    confidence: number;
    context: string;
}