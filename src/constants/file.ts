export const ACCEPTED_TYPES: string[] = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
] as const;

export const ALLOWED_EXTENSIONS: string[] = [
    'pdf',
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'webp'
] as const;

export const FILE_SIZE_LIMITS = {
    GEMINI_MAX: 10 * 1024 * 1024, // 10MB
    GENERAL_MAX: 10 * 1024 * 1024, // 10MB
} as const;

export const MAX_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_REQUEST = 5;
export const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB total