export const getPlaceholder = (isDragging: boolean, isAnalyzing: boolean): string => {
    if (isDragging) {
      return "📁 Drop files here to analyze for PII...";
    }
    if (isAnalyzing) {
      return "🔍 Analyzing files for PII...";
    }
    return "Ask me about PII detection or drag & drop files here...";
};