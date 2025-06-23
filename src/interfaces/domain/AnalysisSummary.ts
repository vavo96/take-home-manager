import { PIIType } from "@/types";

export interface AnalysisSummary {
    totalFiles: number;
    successfulFiles: number;
    failedFiles: number;
    totalPIIFound: number;
    findingsByType: Record<PIIType, number>;
    analysisComplete: boolean;
    hasErrors: boolean;
    errors?: Array<{
        filename: string;
        error: string;
    }>;
    processingTimeMs?: number;
}