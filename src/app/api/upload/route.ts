import { NextRequest, NextResponse } from 'next/server';
import { MAX_FILES_PER_REQUEST, MAX_REQUEST_SIZE } from '@/constants';
import { FileProcessor } from '@/services';
import { APIResponse, FileAnalysisResult } from '@/interfaces';
import { validateFiles, validateRequest, errorResponse, successResponse } from '@/utils';

// Main POST handler
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = new Date().getTime();
  
  try {
    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    // Validate request
    const requestValidation = validateRequest(files);
    if (!requestValidation.valid) {
      return errorResponse(requestValidation.error || 'Invalid request');
    }

    // Validate individual files
    const fileValidation = validateFiles(files);
    if (!fileValidation.valid) {
      return errorResponse(
        `File validation failed:\n${fileValidation.errors.join('\n')}`
      );
    }

    // Process files
    const results = await FileProcessor.processMultipleFiles(files);
    
    // Log processing summary
    const processingTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.length - successCount;
    
    console.log(`Processing completed in ${processingTime}ms:`, {
      total: results.length,
      successful: successCount,
      failed: errorCount,
      totalPIIFound: results.reduce((sum, r) => sum + (r.success ? r.piiFindings.length : 0), 0)
    });

    return NextResponse.json<APIResponse<FileAnalysisResult[]>>(successResponse(results));

  } catch (error) {
    console.error('File processing error:', error);
    
    // Handle specific error types
    if (error instanceof SyntaxError) {
      return errorResponse('Invalid request format', 400);
    }
    
    if (error instanceof Error && error.message.includes('size')) {
      return errorResponse('Request too large', 413);
    }

    return errorResponse(
      'Internal server error during file processing',
      500
    );
  }
}

// GET handler for API info
export async function GET(): Promise<NextResponse> {
  return NextResponse.json<APIResponse>({
    success: true,
    message: 'PII Detection File Upload API',
    data: {
      endpoint: '/api/upload',
      method: 'POST',
      maxFiles: MAX_FILES_PER_REQUEST,
      maxRequestSize: `${Math.round(MAX_REQUEST_SIZE / (1024 * 1024))}MB`,
      supportedFormats: ['PDF', 'JPG', 'JPEG', 'PNG', 'GIF', 'BMP', 'WebP'],
      maxFileSize: '10MB',
      example: {
        formData: {
          files: 'File[]'
        }
      }
    },
    timestamp: new Date().toISOString()
  });
}

// OPTIONS handler for CORS
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 