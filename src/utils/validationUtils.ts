import { MAX_FILES_PER_REQUEST, MAX_REQUEST_SIZE } from "@/constants";
import { APIResponse, FileAnalysisResult } from "@/interfaces";
import { NextResponse } from "next/server";

export const validateRequest = (files: File[]): { valid: boolean; error?: string } => {
    if (!files || files.length === 0) {
      return { valid: false, error: 'No files provided' };
    }
  
    if (files.length > MAX_FILES_PER_REQUEST) {
      return { 
        valid: false, 
        error: `Too many files. Maximum ${MAX_FILES_PER_REQUEST} files allowed per request` 
      };
    }
  
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_REQUEST_SIZE) {
      return { 
        valid: false, 
        error: `Total file size exceeds ${Math.round(MAX_REQUEST_SIZE / (1024 * 1024))}MB limit` 
      };
    }
  
    return { valid: true };
};

export const errorResponse = (error: string, status: number = 400): NextResponse => {
    return NextResponse.json<APIResponse>({
      success: false,
      error,
      timestamp: new Date().toISOString()
    }, { status });
};

export const successResponse = (results: FileAnalysisResult[]) => {
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.length - successCount;
    
    let message = `Processed ${results.length} file(s) successfully`;
    if (errorCount > 0) {
      message += ` (${errorCount} failed)`;
    }
  
    return {
      success: true,
      data: results,
      message,
      timestamp: new Date().toISOString()
    }
  };