import { MessageRole } from "@/types";
import { ToolInvocation } from "../domain";

export interface Message {
    id: string;
    role: MessageRole;
    content: string;
    toolInvocations?: ToolInvocation[];
    timestamp?: string;
}