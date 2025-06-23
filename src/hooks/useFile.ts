'use client';
import { useCallback, useState } from "react";
import { FileAnalysisResult, UploadedFile } from "@/interfaces";
import { AnalysisStatus } from "@/types";
import { generateId } from "@/lib";

export const useFile = () => {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const addFiles = useCallback((files: File[]) => {
      const newFiles: UploadedFile[] = files.map(file => ({
        file,
        id: generateId(),
        status: 'pending' as AnalysisStatus,
      }));
  
      setUploadedFiles(prev => [...prev, ...newFiles]);
      return newFiles;
    }, []);
  
    const updateFileStatus = useCallback((fileId: string, status: AnalysisStatus, result?: FileAnalysisResult) => {
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status, result } : f
      ));
    }, []);
  
    const removeFile = useCallback((fileId: string) => {
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    }, []);
  
    const clearFiles = useCallback(() => {
      setUploadedFiles([]);
      setError(null);
    }, []);
  
    return {
      uploadedFiles,
      isAnalyzing,
      setIsAnalyzing,
      error,
      setError,
      addFiles,
      updateFileStatus,
      removeFile,
      clearFiles
    };
};