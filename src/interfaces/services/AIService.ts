import { FileType } from "@/types";
import { PIIDetectionResult } from "../domain";

export interface AIService {
    analyze(file: File, arrayBuffer: ArrayBuffer, fileType: FileType): Promise<PIIDetectionResult[]>;
}