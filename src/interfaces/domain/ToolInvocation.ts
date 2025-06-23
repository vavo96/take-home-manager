import { ToolState } from "@/types";
import { FileAnalysisResult } from "./UploadedFile";

export interface ToolInvocation {
    toolName: string;
    state: ToolState;
    result?: string | object;
    toolCallId: string;
    args?: {
        results: FileAnalysisResult[];
        [key: string]: unknown;
    };
}