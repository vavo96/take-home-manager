"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { Paperclip, Send, Loader2, X } from "lucide-react";
import { ACCEPTED_TYPES } from "@/constants";
import { FileAnalysisResult, ChatFormProps } from "@/interfaces";
import { cn } from "@/lib";
import { AnalysisStatus } from "@/types";
import { validateFile, getFileIcon, formatFileSize, getPlaceholder } from "@/utils";
import { useFile, useMessage } from "@/hooks";

export default function ChatForm({ onAnalysisComplete, append, disabled }: ChatFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    uploadedFiles,
    isAnalyzing,
    setIsAnalyzing,
    error,
    setError,
    addFiles,
    updateFileStatus,
    removeFile,
    clearFiles
  } = useFile();

  // File processing
  const processFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setIsAnalyzing(true);
    setError(null);

    const newFiles = addFiles(files);
    
    try {
      // Update status to analyzing
      newFiles.forEach(f => updateFileStatus(f.id, 'analyzing'));

      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (data.success) {
        // Update file statuses with results
        newFiles.forEach(newFile => {
          const result = data.data.find((r: FileAnalysisResult) => 
            r.filename === newFile.file.name
          );
          
          if (result) {
            updateFileStatus(
              newFile.id, 
              result.success ? 'completed' : 'error',
              result
            );
          }
        });

        // Notify parent component with real results
        onAnalysisComplete(data.data);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error during upload';
      
      setError(errorMessage);
      
      // Mark all new files as error
      newFiles.forEach(f => updateFileStatus(f.id, 'error'));
    } finally {
      setIsAnalyzing(false);
    }
  }, [addFiles, updateFileStatus, onAnalysisComplete, setIsAnalyzing, setError]);

  // File selection handlers
  const handleFileSelect = useCallback((files: File[]) => {
    const acceptedFiles: File[] = [];
    const rejectedFiles: { file: File; error: string }[] = [];

    files.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        acceptedFiles.push(file);
      } else {
        rejectedFiles.push({ file, error: validation.error || 'Invalid file' });
      }
    });

    if (rejectedFiles.length > 0) {
      const errorMsg = rejectedFiles
        .map(({ file, error }) => `${file.name}: ${error}`)
        .join('\n');
      setError(`Some files were rejected:\n${errorMsg}`);
    }

    if (acceptedFiles.length > 0) {
      processFiles(acceptedFiles);
    }
  }, [processFiles, setError]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileSelect(Array.from(files));
    }
    // Reset input
    e.target.value = '';
  }, [handleFileSelect]);

  // Drag and drop handlers for input
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || isAnalyzing) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [disabled, isAnalyzing, handleFileSelect]);

  // Message handling
  const handleSendMessage = useCallback(async (message: string) => {
    if (append) {
      await append({
        role: 'user',
        content: message,
      });
    }
  }, [append]);

  const {
    input,
    setInput,
    isSending,
    handleSubmit
  } = useMessage(handleSendMessage);

  // Computed values
  const canSubmit = useMemo(() => 
    (input.trim() || uploadedFiles.length > 0) && !disabled && !isAnalyzing && !isSending,
    [input, uploadedFiles.length, disabled, isAnalyzing, isSending]
  );

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getStatusColor = useCallback((status: AnalysisStatus) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'analyzing': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }, []);

  const getStatusIcon = useCallback((status: AnalysisStatus) => {
    switch (status) {
      case 'analyzing': return <Loader2 className="w-3 h-3 animate-spin" />;
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  }, []);

  // Safe placeholder that avoids hydration mismatch
  const currentPlaceholder = useMemo(() => {
    if (!isClient) {
      // Use static placeholder during SSR
      return "Ask me about PII detection or drag & drop files here...";
    }
    // Use dynamic placeholder after hydration
    return getPlaceholder(isDragging, isAnalyzing);
  }, [isClient, isDragging, isAnalyzing]);

  return (
    <div className="w-full space-y-3">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-start justify-between">
            <div className="text-sm text-red-700 dark:text-red-400">
              <strong>Upload Error:</strong>
              <pre className="mt-1 whitespace-pre-wrap font-mono text-xs">{error}</pre>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Uploaded Files List (compact) */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Files ({uploadedFiles.length})
            </h4>
            <button
              onClick={clearFiles}
              disabled={isAnalyzing}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
          
          <div className="max-h-20 overflow-y-auto space-y-1">
            {uploadedFiles.map((uploadedFile) => {
              const IconComponent = getFileIcon(uploadedFile.file) as unknown as React.ElementType;
              
              return (
                <div key={uploadedFile.id} className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                  <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                    <IconComponent className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-900 dark:text-gray-100 truncate font-medium">
                      {uploadedFile.file.name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      ({formatFileSize(uploadedFile.file.size)})
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <div className={cn("flex items-center space-x-0.5", getStatusColor(uploadedFile.status))}>
                      {getStatusIcon(uploadedFile.status)}
                      <span className="text-xs font-medium capitalize">
                        {uploadedFile.status}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => removeFile(uploadedFile.id)}
                      disabled={isAnalyzing}
                      className="text-gray-400 hover:text-red-500 disabled:opacity-50 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Message Input with integrated drag & drop */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <div 
          className="flex-1 relative"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentPlaceholder}
            disabled={disabled || isSending}
            className={cn(
              "w-full px-4 py-3 pr-12 border rounded-lg transition-all duration-200",
              "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
              "placeholder-gray-500 dark:placeholder-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              // Only apply drag styles after hydration
              isClient && isDragging 
                ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20 border-2 border-dashed" 
                : "border-gray-300 dark:border-gray-600"
            )}
          />
          
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={disabled || isAnalyzing}
            className={cn(
              "absolute right-2 top-1/2 transform -translate-y-1/2",
              "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors duration-200"
            )}
            title="Attach files"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFileChange}
            disabled={disabled || isAnalyzing}
            className="hidden"
          />
        </div>
        
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            "px-6 py-3 bg-blue-600 text-white rounded-lg font-medium",
            "hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all duration-200",
            "flex items-center space-x-2"
          )}
        >
          {isSending || isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isAnalyzing ? 'Analyzing...' : 'Sending...'}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
