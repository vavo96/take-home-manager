import { GeminiService } from "./GeminiService";
import { ProcessingErrorFactory } from "./ProcessingErrorFactory";
import { AIService, FileAnalysisResult, PIIDetectionResult } from "@/interfaces";
import { FileType } from "@/types";

export class FileProcessor {
    private static aiService: AIService | null = null;
  
    static async processFile(file: File): Promise<FileAnalysisResult> {
      const startTime = new Date().getTime();
      
      try {
        const fileType = this.getFileType(file);
        const arrayBuffer = await file.arrayBuffer();
        
        const piiFindings = await this.analyzeFile(file, arrayBuffer, fileType);
  
        return {
          filename: file.name,
          fileType,
          piiFindings,
          analysisDate: new Date().toISOString(),
          success: true,
          processingTimeMs: new Date().getTime() - startTime,
        };
      } catch (error) {
        return this.createErrorResult(file, error, new Date().getTime() - startTime);
      }
    }
  
    private static async analyzeFile(
      file: File, 
      arrayBuffer: ArrayBuffer, 
      fileType: FileType
    ): Promise<PIIDetectionResult[]> {
      try {
        const service = await this.getAIService();
        return await service.analyze(file, arrayBuffer, fileType);
      } catch (error) {
        console.warn('AI service failed:', error);
        return [];
      }
    }
  
    private static async getAIService(): Promise<AIService> {
      if (!this.aiService) {
        try {
          this.aiService = new GeminiService();
        } catch (error) {
          console.warn('Failed to initialize AI service:', error);
          throw error;
        }
      }
      return this.aiService;
    }
  
    private static createErrorResult(
      file: File, 
      error: unknown, 
      processingTimeMs: number
    ): FileAnalysisResult {
      let errorMessage = 'An unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes('quota')) {
          errorMessage = ProcessingErrorFactory.quotaExceeded().message;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
  
      return {
        filename: file.name,
        fileType: this.getFileType(file),
        piiFindings: [],
        analysisDate: new Date().toISOString(),
        success: false,
        error: errorMessage,
        processingTimeMs,
      };
    }
  
    static getFileType(file: File): FileType {
      if (file.type === 'application/pdf') return 'pdf';
      if (file.type.startsWith('image/')) return 'image';
      
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'pdf') return 'pdf';
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
        return 'image';
      }
      
      return 'image'; // Default fallback
    }
  
    static async processMultipleFiles(files: File[]): Promise<FileAnalysisResult[]> {
      const results = await Promise.allSettled(
        files.map(file => this.processFile(file))
      );
  
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return this.createErrorResult(
            files[index], 
            result.reason || new Error('Processing failed'),
            0
          );
        }
      });
    }
}