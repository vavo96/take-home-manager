'use client';

import { useMemo, useState } from "react";
import { FileAnalysisResult } from "@/interfaces";
import { AnalysisService } from "@/services";

export const useAnalysis = () => {
    const [analysisResults, setAnalysisResults] = useState<FileAnalysisResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const analysisSummary = useMemo(() => {
      if (analysisResults.length === 0) return null;
      return AnalysisService.createSummary(analysisResults);
    }, [analysisResults]);
  
    return {
      analysisResults,
      setAnalysisResults,
      isLoading,
      setIsLoading,
      analysisSummary
    };
};