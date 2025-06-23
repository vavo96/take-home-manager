import { AnalysisStatus, FileType, PIIType } from "@/types";

export interface PIIDetectionResult {
    type: PIIType;
    value: string;
    confidence: number;
    position: {
        start: number;
        end: number;
    };
    context?: string;
}

export interface FileAnalysisResult {
    filename: string;
    fileType: FileType;
    piiFindings: PIIDetectionResult[];
    analysisDate: string;
    success: boolean;
    error?: string;
    processingTimeMs?: number;
}

export interface UploadedFile {
    file: File;
    id: string;
    status: AnalysisStatus;
    result?: FileAnalysisResult;
}