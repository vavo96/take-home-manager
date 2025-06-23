import { ProcessingError } from "@/interfaces";

export class ProcessingErrorFactory {
    static createError(code: string, message: string, details?: unknown): ProcessingError {
      return { code, message, details };
    }
  
    static quotaExceeded(): ProcessingError {
      return this.createError(
        'QUOTA_EXCEEDED',
        'API quota exceeded. Please check your billing and usage limits.'
      );
    }
  
    static fileSizeExceeded(maxSize: number): ProcessingError {
      return this.createError(
        'FILE_SIZE_EXCEEDED',
        `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`
      );
    }
  
    static parseError(details?: unknown): ProcessingError {
      return this.createError(
        'PARSE_ERROR',
        'Failed to parse AI response',
        details
      );
    }
  
    static apiError(details?: unknown): ProcessingError {
      return this.createError(
        'API_ERROR',
        'AI service temporarily unavailable',
        details
      );
    }
}