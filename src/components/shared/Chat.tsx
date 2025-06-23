'use client';

import { useCallback, useState, useEffect } from "react";
import { Bot, Loader2, User, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, useToast } from "@/components/ui";
import { AnalysisService } from "@/services";
import { FileAnalysisResult, Message, ToolInvocation } from "@/interfaces";
import ChatForm from "./ChatForm";
import { useAnalysis, useChatMessages } from "@/hooks";

// Safe message renderer component
function MessageContent({ content }: { content: string }) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Simple markdown-like formatting without dangerouslySetInnerHTML
  const formatText = (text: string) => {
    if (!isClient) return text; // Return plain text during SSR
    
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{part.slice(1, -1)}</code>;
      }
      // Handle line breaks
      return part.split('\n').map((line, lineIndex, arr) => (
        <span key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < arr.length - 1 && <br />}
        </span>
      ));
    });
  };

  return (
    <div className="prose prose-sm max-w-none">
      {formatText(content)}
    </div>
  );
}

export default function Chat() {
  const { toast } = useToast();
  const { 
    analysisResults, 
    setAnalysisResults, 
    isLoading, 
    setIsLoading,
    analysisSummary 
  } = useAnalysis();
  
  const {
    messages,
    addMessage,
    updateToolInvocation
  } = useChatMessages();

  // Gemini API communication - only for user questions
  const sendMessageToGemini = useCallback(async (
    userMessage: string, 
    includeAnalysis: boolean = false
  ) => {
    setIsLoading(true);
    
    try {
      // Prepare conversation history
      const conversationHistory = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Add current user message
      let contextualMessage = userMessage;
      if (includeAnalysis && analysisResults.length > 0) {
        const analysisContext = `
          Context: I have analysis results for ${analysisResults.length} files with ${analysisSummary?.totalPIIFound || 0} PII instances found.
          Analysis Summary: ${AnalysisService.formatSummaryMarkdown(analysisSummary!)}

          User Question: ${userMessage}`;
        contextualMessage = analysisContext;
      }

      conversationHistory.push({
        role: 'user',
        parts: [{ text: contextualMessage }]
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Add assistant response
      addMessage({
        role: 'assistant',
        content: data.text || data.fallback || "I'm having trouble processing your request right now. Please try again.",
      });

    } catch (error) {
      console.error('Gemini API error:', error);
      
      addMessage({
        role: 'assistant',
        content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. 
          Please try again or check your connection.`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, analysisResults, analysisSummary, addMessage, setIsLoading]);

  // Tool invocation handlers
  const handleAnalyzePIIResults = useCallback(async (
    messageId: string,
    tool: ToolInvocation
  ) => {
    try {
      updateToolInvocation(messageId, tool.toolCallId, { state: 'call' });

      const results = tool.args?.results as FileAnalysisResult[];
      
      if (!AnalysisService.validateResults(results)) {
        throw new Error('Invalid analysis results format');
      }

      const summary = AnalysisService.createSummary(results);
      const summaryMarkdown = AnalysisService.formatSummaryMarkdown(summary);
      
      // Add detailed findings for each file
      let detailedReport = summaryMarkdown;
      
      const successfulResults = results.filter(r => r.success && r.piiFindings.length > 0);
      if (successfulResults.length > 0) {
        detailedReport += `\n### Detailed Findings\n\n`;
        successfulResults.forEach(result => {
          detailedReport += AnalysisService.formatFileDetails(result);
        });
      }

      // Add recommendations
      const recommendations = AnalysisService.getRecommendations(summary);
      if (recommendations.length > 0) {
        detailedReport += `\n### Recommendations\n\n`;
        recommendations.forEach(rec => {
          detailedReport += `- ${rec}\n`;
        });
      }

      // Update tool with results
      updateToolInvocation(messageId, tool.toolCallId, {
        state: 'result',
        result: summary
      });

      // Add comprehensive analysis message
      addMessage({
        role: 'assistant',
        content: detailedReport,
      });

    } catch (error) {
      console.error('Error processing PII analysis:', error);
      
      updateToolInvocation(messageId, tool.toolCallId, {
        state: 'result',
        result: {
          error: error instanceof Error ? error.message : 'Analysis failed',
          analysisComplete: false
        }
      });

      addMessage({
        role: 'assistant',
        content: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [updateToolInvocation, addMessage]);

  // Message processing - only call Gemini for explicit user messages
  const append = useCallback(async (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage = addMessage(message);

    // Only handle user messages that are explicit questions
    if (message.role === 'user' && message.content.trim()) {
      const shouldIncludeAnalysis = message.content.toLowerCase().includes('analyze') || 
                                   message.content.toLowerCase().includes('pii') ||
                                   message.content.toLowerCase().includes('findings') ||
                                   message.content.toLowerCase().includes('report') ||
                                   message.content.toLowerCase().includes('summary');
      
      await sendMessageToGemini(message.content, shouldIncludeAnalysis);
    }

    // Handle tool invocations
    if (message.toolInvocations) {
      for (const tool of message.toolInvocations) {
        if (tool.toolName === 'analyze_pii_results' && tool.state === 'call') {
          await handleAnalyzePIIResults(newMessage.id, tool);
        }
      }
    }
  }, [addMessage, sendMessageToGemini, handleAnalyzePIIResults]);

  // File analysis completion handler - show direct results
  const handleAnalysisComplete = useCallback(async (results: FileAnalysisResult[]) => {
    setAnalysisResults(results);
    
    const summary = AnalysisService.createSummary(results);
    
    // Show appropriate toast notifications
    if (summary.hasErrors) {
      toast({
        title: "Processing Errors",
        description: `${summary.failedFiles} file(s) could not be processed.`,
        variant: "destructive",
      });
    } else if (summary.totalPIIFound > 0) {
      toast({
        title: "PII Detected",
        description: `Found ${summary.totalPIIFound} instances of sensitive data across ${summary.successfulFiles} files.`,
        variant: "success",
      });
    } else {
      toast({
        title: "Analysis Complete",
        description: `All ${summary.successfulFiles} files appear clean of detectable PII.`,
        variant: "default",
      });
    }

    // Add user message representing the uploaded files
    const fileNames = results.map(r => r.filename).join(', ');
    const userMessage = `📁 Uploaded ${results.length} file(s): ${fileNames}`;
    
    addMessage({
      role: 'user',
      content: userMessage,
    });

    // Directly show analysis results without calling Gemini
    const summaryMarkdown = AnalysisService.formatSummaryMarkdown(summary);
    
    // Add detailed findings for each file
    let detailedReport = summaryMarkdown;
    
    const successfulResults = results.filter(r => r.success && r.piiFindings.length > 0);
    if (successfulResults.length > 0) {
      detailedReport += `\n### Detailed Findings\n\n`;
      successfulResults.forEach(result => {
        detailedReport += AnalysisService.formatFileDetails(result);
      });
    }

    // Add recommendations
    const recommendations = AnalysisService.getRecommendations(summary);
    if (recommendations.length > 0) {
      detailedReport += `\n### Recommendations\n\n`;
      recommendations.forEach(rec => {
        detailedReport += `- ${rec}\n`;
      });
      detailedReport += `\n`;
    }

    // Add instructions for further questions
    detailedReport += `\n\nHave questions about these results? Ask me anything about the findings, security implications, or what steps to take next!`;

    // Show the direct analysis results
    addMessage({
      role: 'assistant',
      content: detailedReport,
    });

  }, [setAnalysisResults, toast, addMessage]);
  
  // Tool badge styling
  const getToolBadgeVariant = useCallback((state: string) => {
    switch (state) {
      case 'call': return 'default';
      case 'result': return 'secondary';
      default: return 'outline';
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                PII Detector Assistant
                {analysisSummary && (
                  <Badge variant={analysisSummary.totalPIIFound > 0 ? "default" : "success"} className="ml-2">
                    {analysisSummary.totalPIIFound} PII Found
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-zinc-600 dark:text-zinc-400 mt-1">
                Secure document analysis for personally identifiable information
              </CardDescription>
            </div>
            
            {analysisSummary && (
              <div className="flex items-center gap-2">
                {analysisSummary.totalPIIFound > 0 ? (
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto mb-6 max-h-[600px] space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start space-x-3",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                )}

                <Card className={cn(
                  "max-w-3xl transition-all duration-200",
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-50 dark:bg-gray-800 text-black dark:text-white shadow-sm hover:shadow-md'
                )}>
                  <CardContent className="p-4">
                    <MessageContent content={message.content} />
                    
                    {/* Tool Invocations */}
                    {message.toolInvocations?.map((tool, index) => (
                      <div key={`${tool.toolCallId}-${index}`} className="mt-4 p-3 bg-white/90 dark:bg-gray-700/90 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={getToolBadgeVariant(tool.state)} className="text-xs">
                            {tool.toolName.replace('_', ' ')}
                          </Badge>
                          {tool.state === 'call' && (
                            <div className="flex items-center space-x-2">
                              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">Processing...</span>
                            </div>
                          )}
                        </div>
                        {tool.state === 'result' && tool.result && (
                          <div className="text-xs">
                            {typeof tool.result === 'object' ? (
                              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-gray-900 dark:text-gray-100">
                                Analysis completed successfully
                              </div>
                            ) : (
                              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                <pre className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                                  {tool.result}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <Card className="bg-gray-50 dark:bg-gray-800 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Chat Form */}
          <ChatForm 
            onAnalysisComplete={handleAnalysisComplete} 
            append={append}
            disabled={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}