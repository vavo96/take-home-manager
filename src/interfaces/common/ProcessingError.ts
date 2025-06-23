export interface ProcessingError {
    code: string;
    message: string;
    details?: unknown;
}

export interface ValidationError {
    field: string;
    message: string;
}