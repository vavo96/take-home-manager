import { FileAnalysisResult, Message } from "@/interfaces";

export interface ChatFormProps {
    onAnalysisComplete: (results: FileAnalysisResult[]) => void;
    append?: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
    disabled?: boolean;
}