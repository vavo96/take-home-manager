'use client';
import { Message, ToolInvocation } from "@/interfaces";
import { useCallback, useState, useId, useEffect } from "react";

export const useMessage = (onSend: (message: string) => Promise<void>) => {
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
  
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!input.trim() || isSending) return;
  
      const message = input.trim();
      setInput("");
      setIsSending(true);
      
      try {
        await onSend(message);
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setIsSending(false);
      }
    }, [input, isSending, onSend]);
  
    return {
      input,
      setInput,
      isSending,
      handleSubmit
    };
};

export const useChatMessages = () => {
  const baseId = useId();
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm your **PII Detection Assistant**. I can help you analyze documents and images for personally identifiable information.

      ** What I can detect:**
      - Email addresses  
      - Phone numbers
      - Social Security Numbers (SSN)
      - Credit card numbers
      - Names
      - Addresses

      ** How to use:**
      1. Drag & drop files directly into the message input below
      2. Or click the attachment icon to select files
      3. I'll analyze them and provide a detailed security report

      ** Your privacy matters:** All analysis is done securely and data is not stored.

      Ready to upload your files!`,
      timestamp: '',  // Will be set after hydration
    },
  ]);

  // Update timestamp after hydration
  useEffect(() => {
    if (isClient) {
      setMessages(prev => prev.map(msg => 
        msg.id === 'welcome' && !msg.timestamp 
          ? { ...msg, timestamp: new Date().toISOString() }
          : msg
      ));
    }
  }, [isClient]);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: isClient ? `${baseId}-${Date.now()}` : `temp-${baseId}`,
      timestamp: isClient ? new Date().toISOString() : '',
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, [baseId, isClient]);

  const updateToolInvocation = useCallback((
    messageId: string, 
    toolCallId: string, 
    updates: Partial<ToolInvocation>
  ) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? {
            ...msg,
            toolInvocations: msg.toolInvocations?.map(tool =>
              tool.toolCallId === toolCallId ? { ...tool, ...updates } : tool
            )
          }
        : msg
    ));
  }, []);

  return {
    messages,
    setMessages,
    addMessage,
    updateMessage: () => {},
    updateToolInvocation
  };
};