import { GoogleGenAI } from "@google/genai";
import { FILE_SIZE_LIMITS } from "@/constants";
import { PIIDetectionResult, AIService, AIPIIResponse } from "@/interfaces";
import { ProcessingErrorFactory } from "./ProcessingErrorFactory";
import { FileType } from "@/types";

export class GeminiService implements AIService {
    private genAI: GoogleGenAI;
  
    constructor() {
      if (!process.env.GOOGLE_API_KEY) {
        throw new Error('GOOGLE_API_KEY environment variable is required');
      }
      this.genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    }
  
    async analyze(file: File, arrayBuffer: ArrayBuffer, fileType: FileType): Promise<PIIDetectionResult[]> {
      this.validateFileSize(file);
      
      const systemPrompt = this.createSystemPrompt(fileType);
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      
      const contents = [
        { text: systemPrompt },
        {
          inlineData: {
            data: base64Data,
            mimeType: fileType === 'pdf' ? 'application/pdf' : file.type
          }
        }
      ];
  
      try {
        const result = await this.genAI.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
        });
  
        const text = result.text;
        return this.parseAIResponse(text || '');
      } catch (error) {
        console.error('Gemini API error:', error);
        throw ProcessingErrorFactory.apiError(error);
      }
    }
  
    private validateFileSize(file: File): void {
      if (file.size > FILE_SIZE_LIMITS.GEMINI_MAX) {
        throw ProcessingErrorFactory.fileSizeExceeded(FILE_SIZE_LIMITS.GEMINI_MAX);
      }
    }
  
    private createSystemPrompt(fileType: FileType): string {
      return `You are an expert PII (Personally Identifiable Information) detection system. 
      Analyze the provided ${fileType} file and identify ALL instances of the following PII types:
  
      PII TYPES TO DETECT:
      1. EMAIL ADDRESSES (e.g., john@example.com, user.name@domain.org)
      2. PHONE NUMBERS (any format: (555) 123-4567, +1-555-123-4567, 555.123.4567)
      3. SOCIAL SECURITY NUMBERS (XXX-XX-XXXX, XXX XX XXXX, XXXXXXXXX)
      4. CREDIT CARD NUMBERS (16-digit numbers, may have dashes/spaces)
      5. NAMES (First Name + Last Name combinations, avoid common words)
      6. ADDRESSES (Street addresses with numbers and street names)
  
      RESPONSE FORMAT:
      Return ONLY a valid JSON array with objects containing:
      - type: "email" | "phone" | "ssn" | "credit_card" | "name" | "address"
      - value: the exact PII value found
      - confidence: number between 0-1 (detection confidence)
      - context: surrounding text for context (max 100 characters)
  
      IMPORTANT RULES:
      - Return ONLY the JSON array, no other text
      - Be conservative with names (avoid common words like "John Doe", "Test User")
      - Include partial matches if confidence > 0.7
      - If no PII found, return empty array: []
  
      ANALYZE THE ${fileType.toUpperCase()} NOW:`;
    }
  
    private parseAIResponse(text: string): PIIDetectionResult[] {
      try {
        // Extract JSON from response
        const jsonMatch = text?.split('```json')[1]?.split('```')[0]?.trim();
        const jsonText = jsonMatch ?? '[]';
        const piiData = JSON.parse(jsonText);
        
        if (!Array.isArray(piiData)) {
          console.warn('Invalid response format from Gemini, expected array');
          return [];
        }
  
        return piiData.map((item: AIPIIResponse, index: number): PIIDetectionResult => ({
          type: item.type,
          value: item.value,
          confidence: Math.min(Math.max(item.confidence || 0.8, 0), 1),
          position: {
            start: index * 10,
            end: (index * 10) + (item.value?.length || 0),
          },
          context: item.context || '',
        }));
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        throw ProcessingErrorFactory.parseError(parseError);
      }
    }
  }